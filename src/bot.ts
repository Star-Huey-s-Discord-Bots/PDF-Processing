import Dc from "discord.js";
import fs, { promises as fsp } from "node:fs";

import DotEnv from "dotenv";
DotEnv.config();

const client = new Dc.Client({
  intents: [
    Dc.GatewayIntentBits.Guilds,
    Dc.GatewayIntentBits.GuildMessages,
    Dc.GatewayIntentBits.GuildMembers,
    Dc.GatewayIntentBits.GuildIntegrations,
    Dc.GatewayIntentBits.GuildMessageReactions,
    Dc.GatewayIntentBits.GuildEmojisAndStickers,
    Dc.GatewayIntentBits.MessageContent,
    Dc.GatewayIntentBits.GuildVoiceStates,
    Dc.GatewayIntentBits.GuildMessageTyping,
    Dc.GatewayIntentBits.GuildWebhooks,
    Dc.GatewayIntentBits.GuildPresences,
    Dc.GatewayIntentBits.GuildModeration,
    Dc.GatewayIntentBits.DirectMessages,
    Dc.GatewayIntentBits.DirectMessageReactions,
    Dc.GatewayIntentBits.DirectMessageTyping
  ],
  partials: [
    Dc.Partials.Message,
    Dc.Partials.Channel,
    Dc.Partials.Reaction,
    Dc.Partials.ThreadMember,
    Dc.Partials.GuildMember,
    Dc.Partials.User
  ]
});

client.on(Dc.Events.ClientReady, async () => {
  console.log(`Client @${client.user.tag} is ready`)
});

client.on(Dc.Events.MessageCreate, async (msg) => {
  if (msg.content.trim() !== "我需要物理題目") return;

  let files = await fsp.readdir("./data/Result/");
  let file = files[Math.floor(Math.random() * files.length)];

  let [ origin, page, num ] = file.split(".")[0].split("_");

  msg.reply({
    content: `File: \`${origin}.pdf\`, page ${page} #${num}`,
    files: [
      new Dc.AttachmentBuilder(
        await fsp.readFile(`./data/Result/${file}`)
      )
    ]
  });
});

client.login(process.env.BOT_TOKEN)
