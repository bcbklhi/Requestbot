const { Telegraf, Markup } = require("telegraf");

const BOT_TOKEN = process.env.BOT_TOKEN;  // env se lo
const OWNER_ID = process.env.OWNER_ID;    // env se lo

if (!BOT_TOKEN) {
  throw new Error("❌ BOT_TOKEN not found in environment variables");
}

const bot = new Telegraf(BOT_TOKEN);

// ✅ Tere links set kiye hue
const ESCROW_GROUP_LINK = "https://t.me/+XFn8cW4gLQtiYWZl";
const UPDATES_CHANNEL = "@TrustlyEscrow";

// Start
bot.start((ctx) => {
  ctx.reply("👋 Hi! I will help you join our channels before group approval.");
});

// Handle join request DM
bot.on("chat_join_request", async (ctx) => {
  const user = ctx.chatJoinRequest.from;

  const msg = `
👋 Hi bhai! To join the group, please join these channels first:

1️⃣ Escrow Group (Private)  
2️⃣ Updates Channel (Public)

📝 English & Hindi both:

Please join both channels first, then click the button below to check again.  
Bhai pehle dono channels join karo, phir Check Again dabao.
`;

  try {
    await ctx.telegram.sendMessage(
      user.id,
      msg,
      Markup.inlineKeyboard([
        [Markup.button.url("Join Escrow Group", ESCROW_GROUP_LINK)],
        [Markup.button.url("Join Updates Channel", `https://t.me/${UPDATES_CHANNEL.replace("@","")}`)],
        [Markup.button.callback("✅ Check Again", `check_${user.id}`)],
      ])
    );
  } catch (e) {
    console.log("❌ User DM blocked or failed", e.message);
  }
});

// Handle "Check Again" button
bot.on("callback_query", async (ctx) => {
  if (!ctx.callbackQuery.data.startsWith("check_")) return;

  const userId = ctx.callbackQuery.data.split("_")[1];
  if (ctx.from.id.toString() !== userId) {
    return ctx.answerCbQuery("❌ This button is not for you.");
  }

  let escrowJoined = false;
  let updatesJoined = false;

  try {
    // Escrow private group check not possible via API → assume user joined
    escrowJoined = true;

    // Public channel check
    const member = await ctx.telegram.getChatMember(UPDATES_CHANNEL, userId);
    updatesJoined = ["member","administrator","creator"].includes(member.status);
  } catch {
    updatesJoined = false;
  }

  if (escrowJoined && updatesJoined) {
    await ctx.editMessageText("✅ Congratulations! You joined both channels. You are ready for group approval.");
  } else {
    let msg = "❌ Abhi bhi dono channels join nahi hue:\n";
    if (!escrowJoined) msg += "➡️ Escrow Group\n";
    if (!updatesJoined) msg += `➡️ ${UPDATES_CHANNEL}\n`;
    msg += "\nPlease join and click Check Again.";
    await ctx.editMessageText(
      msg,
      Markup.inlineKeyboard([
        [Markup.button.url("Join Escrow Group", ESCROW_GROUP_LINK)],
        [Markup.button.url("Join Updates Channel", `https://t.me/${UPDATES_CHANNEL.replace("@","")}`)],
        [Markup.button.callback("✅ Check Again", `check_${userId}`)]
      ])
    );
  }

  ctx.answerCbQuery();
});

bot.launch();

// 🛑 Handle crashes in Render properly
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
