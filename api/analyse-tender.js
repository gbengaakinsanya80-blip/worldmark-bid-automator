export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            error: "Only POST requests are allowed."
        });
    }

    try {

        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                success: false,
                error: "OPENAI_API_KEY is not configured on the server."
            });
        }

        const { tenderText } = req.body || {};

        if (!tenderText || tenderText.trim().length < 20) {
            return res.status(400).json({
                success: false,
                error: "No useful tender text was received."
            });
        }

        const MAX_CHARS = 180000;

        const cleanText = tenderText
            .replace(/\u0000/g, "")
            .trim();

        const finalText =
            cleanText.length > MAX_CHARS
                ? cleanText.substring(0, MAX_CHARS) +
                  "\n\n[DOCUMENT TEXT TRUNCATED FOR PROCESSING]"
                : cleanText;

        const systemPrompt = `
You are an expert Nigerian procurement and insurance tender
analysis assistant working for Worldmark Insurance Brokers Ltd.

Carefully analyse the supplied tender document.

NEVER invent information.

Only report information supported by the supplied document.

If information is unavailable, write:
"Not stated in supplied document."

Pay special attention to insurance-related requirements.

Identify:
- client/organisation
- tender reference
- tender title
- issue date
- clarification dates
- submission deadline
- lots
- services required
- eligibility requirements
- mandatory documents
- insurance requirements
- technical requirements
- financial requirements
- submission method
- submission address/email/portal
- evaluation criteria
- important warnings
- questions Worldmark should clarify

For Worldmark Insurance Brokers Ltd, assess whether the tender
appears suitable for:
- insurance brokerage
- insurance company
- HMO
- life insurance
- general insurance
- employee benefits
- claims services
- other insurance-related services.

Do not assume NAICOM registration is required unless the
document specifically says so.

Do not create fake certificates or documents.

If the supplied document is only an invitation notice and says
that a complete ITT/tender pack contains additional requirements,
clearly state that the full tender pack is required for complete
analysis.

Return ONLY valid JSON.
`;

        const userPrompt = `
Analyse the following tender document for Worldmark Insurance
Brokers Ltd.

TENDER DOCUMENT:

${finalText}
`;

        const response = await fetch(
            "https://api.openai.com/v1/responses",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },

                body: JSON.stringify({

                    model: "gpt-5.6-luna",

                    input: [
                        {
                            role: "system",
                            content: systemPrompt
                        },
                        {
                            role: "user",
                            content: userPrompt
                        }
                    ],

                    text: {
                        format: {
                            type: "json_schema",
                            name: "tender_analysis",
                            strict: true,

                            schema: {

                                type: "object",

                                properties: {

                                    client: {
                                        type: "string"
                                    },

                                    tender_reference: {
                                        type: "string"
                                    },

                                    tender_title: {
                                        type: "string"
                                    },

                                    issue_date: {
                                        type: "string"
                                    },

                                    clarification_deadline: {
                                        type: "string"
                                    },

                                    submission_deadline: {
                                        type: "string"
                                    },

                                    lots: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                lot_number: {
                                                    type: "string"
                                                },
                                                description: {
                                                    type: "string"
                                                }
                                            },
                                            required: [
                                                "lot_number",
                                                "description"
                                            ],
                                            additionalProperties: false
                                        }
                                    },

                                    services_required: {
                                        type: "array",
                                        items: {
                                            type: "string"
                                        }
                                    },

                                    suitable_for_worldmark: {
                                        type: "boolean"
                                    },

                                    bidder_type: {
                                        type: "array",
                                        items: {
                                            type: "string"
                                        }
                                    },

                                    insurance_requirements: {
                                        type: "array",
                                        items: {
                                            type: "string"
                                        }
                                    },

                                    eligibility_requirements: {
                                        type: "array",
                                        items: {
                                            type: "string"
                                        }
                                    },

                                    mandatory_documents: {
                                        type: "array",
                                        items: {
                                            type: "string"
                                        }
                                    },

                                    technical_requirements: {
                                        type: "array",
                                        items: {
                                            type: "string"
                                        }
                                    },

                                    financial_requirements: {
                                        type: "array",
                                        items: {
                                            type: "string"
                                        }
                                    },

                                    submission_method: {
                                        type: "array",
                                        items: {
                                            type: "string"
                                        }
                                    },

                                    submission_contact: {
                                        type: "array",
                                        items: {
                                            type: "string"
                                        }
                                    },

                                    evaluation_criteria: {
                                        type: "array",
                                        items: {
                                            type: "string"
                                        }
                                    },

                                    important_warnings: {
                                        type: "array",
                                        items: {
                                            type: "string"
                                        }
                                    },

                                    missing_information: {
                                        type: "array",
                                        items: {
                                            type: "string"
                                        }
                                    },

                                    clarification_questions: {
                                        type: "array",
                                        items: {
                                            type: "string"
                                        }
                                    },

                                    executive_summary: {
                                        type: "string"
                                    }

                                },

                                required: [
                                    "client",
                                    "tender_reference",
                                    "tender_title",
                                    "issue_date",
                                    "clarification_deadline",
                                    "submission_deadline",
                                    "lots",
                                    "services_required",
                                    "suitable_for_worldmark",
                                    "bidder_type",
                                    "insurance_requirements",
                                    "eligibility_requirements",
                                    "mandatory_documents",
                                    "technical_requirements",
                                    "financial_requirements",
                                    "submission_method",
                                    "submission_contact",
                                    "evaluation_criteria",
                                    "important_warnings",
                                    "missing_information",
                                    "clarification_questions",
                                    "executive_summary"
                                ],

                                additionalProperties: false
                            }
                        }
                    }
                })
            }
        );

        if (!response.ok) {

            const errorText = await response.text();

            console.error(
                "OpenAI API Error:",
                errorText
            );

            return res.status(500).json({
                success: false,
                error: "AI analysis failed.",
                details: errorText
            });
        }

        const data = await response.json();

        let aiText = "";

        if (data.output && Array.isArray(data.output)) {

            for (const item of data.output) {

                if (
                    item.type === "message" &&
                    Array.isArray(item.content)
                ) {

                    for (const content of item.content) {

                        if (
                            content.type === "output_text" &&
                            content.text
                        ) {
                            aiText += content.text;
                        }

                    }
                }
            }
        }

        if (!aiText) {
            return res.status(500).json({
                success: false,
                error: "The AI returned an empty response."
            });
        }

        let analysis;

        try {
            analysis = JSON.parse(aiText);
        } catch (parseError) {

            console.error(
                "JSON parsing error:",
                parseError
            );

            return res.status(500).json({
                success: false,
                error: "AI returned invalid structured data."
            });
        }

        return res.status(200).json({
            success: true,
            analysis: analysis
        });

    } catch (error) {

        console.error(
            "Server error:",
            error
        );

        return res.status(500).json({
            success: false,
            error: "Unexpected server error.",
            details: error.message
        });
    }
}
