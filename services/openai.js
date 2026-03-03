const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateEmail(
  name,
  company,
  painPoint,
  senderName,
  senderPhone,
  senderCompany
) {
  let signature = "";

  if (senderName) signature += `\n${senderName}`;
  if (senderCompany) signature += `\n${senderCompany}`;
  if (senderPhone) signature += `\n${senderPhone}`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Tu es un expert en copywriting B2B. Tu écris uniquement en français."
      },
      {
        role: "user",
        content: `
Rédige un email de prospection personnalisé en français.

Prospect : ${name}
Entreprise : ${company}
Problématique : ${painPoint}

Structure :
- Ligne d'objet
- Email professionnel (max 120 mots)
- Proposition d'appel 15 min

Signature :
${signature || "Aucune signature"}
        `
      }
    ],
    temperature: 0.7
  });

  return response.choices[0].message.content;
}

module.exports = { generateEmail };