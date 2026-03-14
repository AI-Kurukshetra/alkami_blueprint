interface InsightRequest {
  userId: string;
  monthToDateSpend: number;
  monthToDateIncome: number;
}

Deno.serve(async (request) => {
  const payload = (await request.json()) as InsightRequest;
  const savingsRate =
    payload.monthToDateIncome === 0
      ? 0
      : (payload.monthToDateIncome - payload.monthToDateSpend) /
        payload.monthToDateIncome;

  return new Response(
    JSON.stringify({
      userId: payload.userId,
      savingsRate,
      summary:
        savingsRate > 0.2
          ? "Cash flow is healthy and supports accelerated goal funding."
          : "Spending is compressing savings capacity this month."
    }),
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
});

