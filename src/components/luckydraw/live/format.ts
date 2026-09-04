export const formatWonAt = (wonAt: string) =>
  new Date(wonAt).toLocaleTimeString("en-SG", {
    hour: "2-digit",
    minute: "2-digit",
  });
