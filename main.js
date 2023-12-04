const { google } = require("googleapis");
const OAuth2Data = require("./google_key.json");
const express = require("express");
const app = express();
const port = 3000;

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

const client = new google.auth.OAuth2(
  OAuth2Data.client_id,
  OAuth2Data.client_secret,
  OAuth2Data.redirect_uris[0]
);

app.get("/auth/google", (req, res) => {
  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar.readonly"],
  });
  res.redirect(authUrl);
});

app.get("/auth/google/callback", async (req, res) => {
  const { tokens } = await client.getToken(req.query.code);

  const accessToken = tokens.access_token;
  const refreshToken = tokens.refresh_token;

  const baseUrl = req.protocol + "://" + req.get("host");

  const eventsEndpoint = `${baseUrl}/api/events?accessToken=${accessToken}&refreshToken=${refreshToken}`;

  res.send(
    `<h1>Eventos de Google Calendar</h1><a href="${eventsEndpoint}">Obtener eventos</a>`
  );
});

async function getGoogleCalendarEvents(auth) {
  const calendar = google.calendar({ version: "v3", auth });
  const now = new Date();
  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: now.toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: "startTime",
  });

  return response.data.items;
}

app.get("/api/events", async (req, res) => {
  try {
    const accessToken = req.query.accessToken;
    const refreshToken = req.query.refreshToken;

    client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const events = await getGoogleCalendarEvents(client);
    res.json(events);
  } catch (error) {
    console.error("Error al obtener eventos:", error);
    res.status(500).send("Error interno del servidor");
  }
});

async function getGoogleCalendarEvents(auth) {
  const calendar = google.calendar({ version: "v3", auth });
  const events = await calendar.events.list({
    calendarId: "primary",
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: "startTime",
  });

  return events.data.items;
}
