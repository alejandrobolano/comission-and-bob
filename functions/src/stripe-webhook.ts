
import { onRequest } from "firebase-functions/v2/https";
import Stripe from "stripe";
import * as admin from "firebase-admin";
import { defineSecret } from "firebase-functions/params";

admin.initializeApp();

const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");

function toStr(x: unknown): string {
  return typeof x === "string" ? x : x ? String(x) : "";
}

async function findUserByStripeCustomerId(customerId: string) {
  const qs = await admin
    .firestore()
    .collection("users")
    .where("stripeCustomerId", "==", customerId)
    .limit(1)
    .get();

  if (qs.empty) return null;
  return qs.docs[0].ref;
}

export const stripeWebhook = onRequest(
  {
    secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET],
    region: "us-central1", 
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY.value());

    const sig = req.headers["stripe-signature"];
    if (!sig) {
      res.status(400).send("Missing stripe-signature");
      return;
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        toStr(sig),
        STRIPE_WEBHOOK_SECRET.value()
      );
    } catch (err) {
      console.error("Webhook signature failed:", err);
      res.status(400).send("Webhook signature failed");
      return;
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;

        const uid = session.client_reference_id || "";
        if (!uid) {
          res.status(500).send("No client_reference_id (uid) in session");
          return;
        }

        await admin.firestore().doc(`users/${uid}`).set(
          {
            hasMembership: true,
            membershipStatus: "active",
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            cancelAtPeriodEnd: false,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        res.json({ received: true });
        return;
      }

      if (event.type === "customer.subscription.updated") {
        const sub = event.data.object as Stripe.Subscription;

        const customerId = toStr(sub.customer);
        if (!customerId) {
          res.status(500).send("No customer on subscription");
          return;
        }

        const userRef = await findUserByStripeCustomerId(customerId);
        if (!userRef) {
          res.status(500).send("User not found for customer");
          return;
        }

        const isCancelPending = sub.cancel_at_period_end === true;
        const currentPeriodEnd = (sub as any).current_period_end ?? (sub.items?.data?.[0] as any)?.current_period_end ?? null;

        await userRef.set(
          {
            stripeSubscriptionId: sub.id,
            currentPeriodEnd,
            cancelAtPeriodEnd: isCancelPending,
            hasMembership: !(sub.status === "canceled" || !!(sub as any).ended_at),
            membershipStatus:
                sub.status === "canceled" || !!(sub as any).ended_at
                    ? "inactive"
                    : sub.cancel_at_period_end
                        ? "pending"
                        : "active",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        res.json({ received: true });
        return;
      }

      if (event.type === "customer.subscription.deleted") {
        const sub = event.data.object as Stripe.Subscription;

        const customerId = toStr(sub.customer);
        if (!customerId) {
          res.status(500).send("No customer on subscription");
          return;
        }

        const userRef = await findUserByStripeCustomerId(customerId);
        if (!userRef) {
          res.status(500).send("User not found for customer");
          return;
        }

        await userRef.set(
          {
            hasMembership: false,
            membershipStatus: "inactive",
            cancelAtPeriodEnd: false,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        res.json({ received: true });
        return;
      }

      res.json({ received: true });
      return;
    } catch (err) {
      console.error("Webhook handler error:", err);
      res.status(500).send("Webhook handler failed");
      return;
    }
  }
);
