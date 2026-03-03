const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateEmail(
  name,
  company,
  painPoint,
  levers,
  senderName,
  senderPhone,
  senderCompany
) {
  try {
    // ---------- Signature propre ----------
    let signatureParts = [];

    if (senderName && senderName.trim() !== "") {
      signatureParts.push(senderName.trim());
    }

    if (senderCompany && senderCompany.trim() !== "") {
      signatureParts.push(senderCompany.trim());
    }

    if (senderPhone && senderPhone.trim() !== "") {
      signatureParts.push(senderPhone.trim());
    }

    const signature =
      signatureParts.length > 0
        ? "\n\n" + signatureParts.join("\n")
        : "";

    // ---------- Gestion des leviers ----------
    let leverText = "";

    if (Array.isArray(levers) && levers.length > 0) {
      const cleanedLevers = levers
        .map(l => l.trim())
        .filter(l => l !== "");

      if (cleanedLevers.length > 0) {
        leverText =
          "\n\nLeviers potentiels à intégrer si pertinent :\n" +
          cleanedLevers.map(l => "- " + l).join("\n");
      }
    }

    // ---------- Construction prompt ----------
    const prompt = `
Rédige un email de prospection B2B personnalisé en français.

Prospect : ${name}
Entreprise : ${company}
Problématique principale : ${painPoint}
${leverText}

Contraintes :
- Ton professionnel et naturel
- Maximum 120 mots
- Pas de phrases génériques
- Clair, orienté résultat
- Inclure un appel à action pour un échange de 15 minutes

Structure obligatoire :
1. Ligne d'objet
2. Corps du mail
3. Conclusion avec proposition d'appel
${signature}
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Tu es un expert en copywriting B2B spécialisé en prospection commerciale. Tu écris uniquement en français."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7
    });

    if (
      response &&
      response.choices &&
      response.choices[0] &&
      response.choices[0].message &&
      response.choices[0].message.content
    ) {
      return response.choices[0].message.content;
    }

    return "Erreur : aucune réponse générée.";

  } catch (error) {
    console.error("Erreur OpenAI:", error);
    return "Erreur lors de la génération de l'email.";
  }
}

module.exports = { generateEmail };