interface FraudPayload {
  transactionId: string;
  accountId: string;
  amount: number;
  merchantName?: string;
}

Deno.serve(async (request) => {
  const payload = (await request.json()) as FraudPayload;

  const severity =
    payload.amount > 2500 ? "high" : payload.amount > 1000 ? "medium" : "low";

  return new Response(
    JSON.stringify({
      transactionId: payload.transactionId,
      accountId: payload.accountId,
      severity,
      recommendedAction:
        severity === "high" ? "step_up_authentication" : "allow_with_monitoring"
    }),
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
});

