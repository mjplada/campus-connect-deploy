import { WebClient } from 'https://deno.land/x/slack_web_api@6.7.2/mod.js'

const slackBotToken = Deno.env.get("SLACK_TOKEN") ?? "";
const slackChannelId = Deno.env.get("SLACK_CHANNEL_ID") ?? "";
const botClient = new WebClient(slackBotToken); 

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    console.log("Nuevo post recibido:", body);

    const { record } = body;
    const { username, description, created_at } = record;

    const message = `📢 *Nuevo post creado*\n- *Usuario:* ${username}\n- *Descripción:* ${description}\n- *Fecha:* ${new Date(created_at).toLocaleString()}`;

    const response = await botClient.chat.postMessage({
      channel: slackChannelId, 
      text: message,
    });

    console.log("Mensaje enviado a Slack:", response);
    return new Response("Notificación enviada a Slack", { status: 200 });
  } catch (error) {
    console.error("Error al enviar notificación a Slack:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});
