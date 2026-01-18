import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import Stripe from "stripe";
import * as admin from "firebase-admin";

admin.initializeApp();

const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");

export const cancelSubscription = onRequest(
  { secrets: [STRIPE_SECRET_KEY] },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const stripe = new Stripe(STRIPE_SECRET_KEY.value());

      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const idToken = authHeader.split("Bearer ")[1];
      const decoded = await admin.auth().verifyIdToken(idToken);
      const uid = decoded.uid;

      const userRef = admin.firestore().doc(`users/${uid}`);
      const snap = await userRef.get();
      if (!snap.exists) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const userData = snap.data() || {};
      const subId = userData.stripeSubscriptionId as string | undefined;

      if (!subId) {
        res.status(400).json({ error: "No stripeSubscriptionId on user" });
        return;
      }

    //   await stripe.subscriptions.cancel(subId);    
        await stripe.subscriptions.update(subId, {
          cancel_at_period_end: true,
        });

        await userRef.set(
            {
                membershipStatus: "pending",  
                cancelAtPeriodEnd: true,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
        );

      res.json({ ok: true });
      return;
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e?.message || "Cancel failed" });
      return;
    }
  }
);
