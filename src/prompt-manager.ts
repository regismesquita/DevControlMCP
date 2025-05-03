import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { capture } from "./utils.js";

// Define schemas for validation
// Basic schema for inputs - currently only string type is supported
const InputDefinitionSchema = z.record(z.literal("string"));

// Schema for custom prompt definition (parsed from environment variable)
const CustomPromptDefinitionSchema = z.object({
  inputs: InputDefinitionSchema,
  message: z.array(z.string()), 
  description: z.string().optional(),
});

// Types based on validation schemas
export type CustomPromptDefinition = z.infer<typeof CustomPromptDefinitionSchema>;

// MCP message format
export interface MCPMessage {
  role: "user";
  content: { 
    type: "text"; 
    text: string 
  };
}

// Internal representation of a registered prompt
export interface RegisteredPrompt {
  name: string;
  description?: string;
  inputSchema: any; // JSON Schema object derived from inputs
  messageGenerator: (args: Record<string, string>) => MCPMessage[];
}

/**
 * Extracts placeholder variables from message strings
 * @param messageArray Array of message strings that may contain placeholders
 * @returns Set of unique placeholder variable names
 */
export function extractPlaceholders(messageArray: string[]): Set<string> {
  const placeholderPattern = /\{([a-zA-Z0-9_]+)\}/g;
  const placeholders = new Set<string>();

  for (const messagePart of messageArray) {
    let match;
    while ((match = placeholderPattern.exec(messagePart)) !== null) {
      placeholders.add(match[1]);
    }
  }

  return placeholders;
}

/**
 * Creates a JSON Schema from the inputs definition
 * @param inputs Record of input names to types
 * @returns JSON Schema object
 */
export function createInputSchema(inputs: Record<string, "string">): any {
  // Create a Zod schema from the inputs definition
  const properties: Record<string, z.ZodString> = {};
  
  for (const key of Object.keys(inputs)) {
    // Currently, only string type is supported
    properties[key] = z.string();
  }
  
  // Create a Zod object schema with all fields marked as required
  const zodSchema = z.object(properties);
  
  // Convert to JSON Schema
  const jsonSchema = zodToJsonSchema(zodSchema);
  
  // Add required array to make all properties required
  const requiredFields = Object.keys(inputs);
  return {
    ...jsonSchema,
    required: requiredFields,
  };
}

/**
 * Creates a message generator function for a custom prompt
 * @param messageTemplate Array of message parts
 * @returns Function that generates MCP message array from arguments
 */
export function createMessageGenerator(messageTemplate: string[]): (args: Record<string, string>) => MCPMessage[] {
  return (args: Record<string, string>): MCPMessage[] => {
    // Interpolate placeholders in message template
    const interpolatedParts = messageTemplate.map(part => {
      return part.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
        return args[key] !== undefined ? args[key] : match;
      });
    });

    // Join message parts with double newlines
    const generatedText = interpolatedParts.join("\n\n");

    // Return the MCP message array with a single user message
    return [
      {
        role: "user",
        content: {
          type: "text",
          text: generatedText,
        },
      },
    ];
  };
}

/**
 * Core prompt manager class that handles environment variable parsing
 * and prompt registration
 */
class PromptManager {
  private prompts: Record<string, RegisteredPrompt> = {};
  
  /**
   * Extract and prepare prompts from environment variables
   * @returns Map of registered prompts
   */
  /**
   * Preprocesses an environment variable value that might be in single-quoted JSON format
   * and converts it to standard JSON format for parsing
   * @param envValue String value from environment variable
   * @returns Preprocessed string ready for JSON parsing
   */
  private preprocessEnvValue(envValue: string): string {
    // Trim any leading or trailing whitespace
    const trimmedValue = envValue.trim();
    
    // Check if the value is enclosed in single quotes (starts with ' and ends with ')
    if (trimmedValue.startsWith("'") && trimmedValue.endsWith("'")) {
      // Extract the content between the single quotes
      const content = trimmedValue.substring(1, trimmedValue.length - 1);
      
      // Return the content as is, ready for JSON parsing
      return content;
    }
    
    // If not in single-quoted format, return as is
    return envValue;
  }

  public extractAndPreparePrompts(): Record<string, RegisteredPrompt> {
    console.error("Scanning for MCP prompt definitions in environment variables...");
    const envVarPrefix = "MCP_PROMPT_DEF_";
    let promptCount = 0;
    let errorCount = 0;
    
    // Scan environment variables for prompt definitions
    for (const key of Object.keys(process.env)) {
      if (key.startsWith(envVarPrefix)) {
        const promptName = key.substring(envVarPrefix.length).toLowerCase();
        const envValue = process.env[key];
        
        if (!envValue || envValue.trim() === "") {
          console.error(`Warning: Empty prompt definition for ${key}, skipping.`);
          errorCount++;
          continue;
        }
        
        try {
          // Preprocess the env value to handle single-quoted JSON format
          const preprocessedValue = this.preprocessEnvValue(envValue);
          
          // Parse the JSON value
          const parsedValue = JSON.parse(preprocessedValue);
          
          // Validate the structure
          const validationResult = CustomPromptDefinitionSchema.safeParse(parsedValue);
          
          if (!validationResult.success) {
            console.error(`Error: Invalid prompt definition for ${key}: ${validationResult.error.message}`);
            errorCount++;
            continue;
          }
          
          const promptDef = validationResult.data;
          
          // Extract placeholders from message template
          const placeholders = extractPlaceholders(promptDef.message);
          
          // Verify all placeholders exist in inputs
          const missingPlaceholders = [...placeholders].filter(p => !(p in promptDef.inputs));
          
          if (missingPlaceholders.length > 0) {
            console.error(`Error: Prompt definition ${key} contains placeholders not defined in inputs: ${missingPlaceholders.join(", ")}`);
            errorCount++;
            continue;
          }
          
          // Create input schema
          const inputSchema = createInputSchema(promptDef.inputs);
          
          // Create message generator
          const messageGenerator = createMessageGenerator(promptDef.message);
          
          // Register the prompt
          this.prompts[promptName] = {
            name: promptName,
            description: promptDef.description || `Prompt for ${promptName}`,
            inputSchema,
            messageGenerator,
          };
          
          console.error(`Registered custom MCP prompt: ${promptName}`);
          promptCount++;
        } catch (error) {
          console.error(`Error parsing prompt definition for ${key}: ${error instanceof Error ? error.message : String(error)}`);
          errorCount++;
        }
      }
    }
    
    console.error(`Prompt registration complete. Registered ${promptCount} prompts. Encountered ${errorCount} errors.`);
    return this.prompts;
  }
  
  /**
   * Get all registered prompts
   * @returns Map of registered prompts
   */
  public getRegisteredPrompts(): Record<string, RegisteredPrompt> {
    return this.prompts;
  }
  
  /**
   * Check if a prompt is registered
   * @param name Prompt name
   * @returns True if prompt exists
   */
  public hasPrompt(name: string): boolean {
    return name in this.prompts;
  }
  
  /**
   * Get a registered prompt
   * @param name Prompt name
   * @returns Registered prompt or undefined
   */
  public getPrompt(name: string): RegisteredPrompt | undefined {
    return this.prompts[name];
  }
}

// Export singleton instance
export const promptManager = new PromptManager();
