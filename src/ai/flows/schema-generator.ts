import { defineFlow } from "genkit";
import { ai } from "../genkit";
import { z } from "zod";

const TableRowSchema = z.object({
  field: z.string().describe("The name of the database field, using dot notation for nested fields (e.g., 'address.street')."),
  type: z.string().describe("The data type of the field (e.g., string, number, ObjectId, Object, or enum values like 'Enum (VALUE1, VALUE2)')."),
  description: z.string().describe("A brief description of what the field represents."),
});

const outputSchema = z.object({
  jsonSchema: z.string().describe("A string containing the formatted, human-readable JSON representation of the schema."),
  tableData: z.array(TableRowSchema).describe("An array of objects, where each object represents a row in the HTML table."),
});

const prompt = `
You are an expert database architect specializing in MongoDB. A user will provide a text-based definition for a MongoDB collection schema. Your task is to convert this definition into two formats: 
1. A human-readable JSON representation (as a single formatted string).
2. A flat list of fields for an HTML table.

**Input Format Rules:**
- The first line is the collection name, which should be the root of the JSON object.
- Each subsequent line represents a field.
- A line starting with '// Objeto (object_name)' or '// objeto (object_name)' defines a nested object. The fields immediately following it belong to this object until a new object is defined or the input ends.
- Text in parentheses like '(VALUE1 - VALUE2 - ...)' or '(VALUE1, VALUE2)' indicates an enum of possible string values.
- Infer common MongoDB data types. For an ID field like 'institucion_id', assume it's an 'ObjectId'. For other fields, assume 'String' unless context suggests otherwise.

**Example Input:**
\`\`\`
Institución (MONGO DB):

institucion_id
// Objeto (informacion_institucion)
nombre_institución
codigo_modular
tipo_institución (PUBLICA - PRIVADA - PARROQUIAL)
nivel_institución (INICIAL)

// objeto (dirección)
calle
distrito
provincia
departamento
codigo_postal
\`\`\`

**Your Output MUST be a valid JSON object matching the provided Zod schema.**

**Example Output for the input above:**
\`\`\`json
{
  "jsonSchema": "{\\n  \\"Institución\\": {\\n    \\"institucion_id\\": \\"ObjectId\\",\\n    \\"informacion_institucion\\": {\\n      \\"nombre_institución\\": \\"String\\",\\n      \\"codigo_modular\\": \\"String\\",\\n      \\"tipo_institución\\": {\\n        \\"enum\\": [\\"PUBLICA\\", \\"PRIVADA\\", \\"PARROQUIAL\\"]\\n      },\\n      \\"nivel_institución\\": \\"String\\"\\n    },\\n    \\"dirección\\": {\\n      \\"calle\\": \\"String\\",\\n      \\"distrito\\": \\"String\\",\\n      \\"provincia\\": \\"String\\",\\n      \\"departamento\\": \\"String\\",\\n      \\"codigo_postal\\": \\"String\\"\\n    }\\n  }\\n}",
  "tableData": [
    { "field": "institucion_id", "type": "ObjectId", "description": "Identificador único de la institución." },
    { "field": "informacion_institucion", "type": "Object", "description": "Objeto anidado con información de la institución." },
    { "field": "informacion_institucion.nombre_institución", "type": "String", "description": "Nombre de la institución." },
    { "field": "informacion_institucion.codigo_modular", "type": "String", "description": "Código modular de la institución." },
    { "field": "informacion_institucion.tipo_institución", "type": "Enum (PUBLICA, PRIVADA, PARROQUIAL)", "description": "Tipo de gestión de la institución." },
    { "field": "informacion_institucion.nivel_institución", "type": "String", "description": "Nivel educativo. Ejemplo: INICIAL." },
    { "field": "dirección", "type": "Object", "description": "Objeto anidado con la dirección." },
    { "field": "dirección.calle", "type": "String", "description": "Calle de la dirección." },
    { "field": "dirección.distrito", "type": "String", "description": "Distrito de la dirección." },
    { "field": "dirección.provincia", "type": "String", "description": "Provincia de la dirección." },
    { "field": "dirección.departamento", "type": "String", "description": "Departamento de la dirección." },
    { "field": "dirección.codigo_postal", "type": "String", "description": "Código postal de la dirección." }
  ]
}
\`\`\`

Now, process the following user input and provide the output in the specified JSON format.

User Input:
\`\`\`
{{definition}}
\`\`\`
`;

export const schemaGeneratorFlow = defineFlow(
  {
    name: "schemaGenerator",
    inputSchema: z.string(),
    outputSchema: outputSchema,
  },
  async (definition) => {
    const llmResponse = await ai.generate({
      prompt: prompt.replace('{{definition}}', definition),
      model: "googleai/gemini-1.5-flash",
      output: {
        schema: outputSchema,
      },
      config: {
        temperature: 0.1
      }
    });

    return llmResponse.output()!;
  }
);
