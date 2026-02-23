const allowedOrigins = [
  "https://srh-info.org",
  "https://www.srh-info.org",
  process.env.NODE_ENV === "development" ? "http://localhost:5173" : null,
  process.env.NODE_ENV === "development" ? "http://localhost:3002" : null,
].filter(Boolean);

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else if (!origin) {
    // Allow same-origin requests (no Origin header)
    res.setHeader("Access-Control-Allow-Origin", allowedOrigins[0]);
  }
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

module.exports = { setCorsHeaders };
