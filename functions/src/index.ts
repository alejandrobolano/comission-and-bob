// functions/src/index.ts
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import Stripe from "stripe";
import * as admin from "firebase-admin";

admin.initializeApp();

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripePriceId = defineSecret("STRIPE_PRICE_ID");

function isAllowedOrigin(origin: string): boolean {
  return (
    origin === "http://localhost:5173" ||
    origin === "http://localhost:3000" ||
    origin === "https://comission-and-bob.web.app" ||
    origin === "https://comission-and-bob.firebaseapp.com" ||
    /^https:\/\/comission-and-bob--.+\.web\.app$/.test(origin) ||
    /^https:\/\/comission-and-bob--.+\.firebaseapp\.com$/.test(origin)
  );
}

export { stripeWebhook } from "./stripe-webhook";
export { cancelSubscription } from "./stripe-cancel-subscription";
export { resumeSubscription } from "./stripe-resume-subscription";

export const createCheckoutSession = onRequest(
  {
    secrets: [stripeSecretKey, stripePriceId],
  },
  async (req, res) => {
    const origin = String(req.headers.origin || "");
    const allowed = isAllowedOrigin(origin);

    if (allowed) {
      res.set("Access-Control-Allow-Origin", origin);
      res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.set("Access-Control-Max-Age", "86400");
    }

    if (req.method === "OPTIONS") {
      if (!allowed) {
        res.status(403).send("CORS not allowed");
        return;
      }
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const secretKey = stripeSecretKey.value();
      const priceId = stripePriceId.value();

      if (!secretKey) {
        res.status(500).json({ error: "Missing STRIPE_SECRET_KEY" });
        return;
      }
      if (!priceId) {
        res.status(500).json({ error: "Missing STRIPE_PRICE_ID" });
        return;
      }

      const stripe = new Stripe(secretKey);

      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const idToken = authHeader.split("Bearer ")[1];
      const decoded = await admin.auth().verifyIdToken(idToken);

      const uid = decoded.uid;
      const email = decoded.email;

      if (!email) {
        res.status(400).json({ error: "No email" });
        return;
      }

      const userRef = admin.firestore().doc(`users/${uid}`);
      const userSnap = await userRef.get();
      const userData = userSnap.data();

      let customerId = userData?.stripeCustomerId as string | undefined;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email,
          metadata: { uid },
        });
        customerId = customer.id;

        await userRef.set({ stripeCustomerId: customerId }, { merge: true });
      }

      const baseUrl = origin || "https://comission-and-bob.web.app";

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${baseUrl}/success`,
        cancel_url: `${baseUrl}/membership`,
        client_reference_id: uid,
      });

      res.json({ url: session.url });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err?.message || "Error creando checkout" });
    }
  }
);
