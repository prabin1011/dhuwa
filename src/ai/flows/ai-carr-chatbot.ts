'use server';
/**
 * @fileOverview An AI Psych-Coach to help users quit smoking.
 *
 * - aiCoachChatbot - A function that handles the conversation with the user.
 * - AiCoachChatbotInput - The input type for the aiCoachChatbot function.
 * - AiCoachChatbotOutput - The return type for the aiCoachChatbot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiCoachChatbotInputSchema = z.object({
  message: z.string().describe('The user message to the chatbot.'),
});
export type AiCoachChatbotInput = z.infer<typeof AiCoachChatbotInputSchema>;

const AiCoachChatbotOutputSchema = z.object({
  response: z.string().describe('The chatbot response to the user message.'),
});
export type AiCoachChatbotOutput = z.infer<typeof AiCoachChatbotOutputSchema>;

export async function aiCoachChatbot(
  input: AiCoachChatbotInput
): Promise<AiCoachChatbotOutput> {
  return aiCoachChatbotFlow(input);
}

// A radically simplified system prompt for debugging the connection.
const systemPrompt = `You are an AI assistant. When asked "who are you", say "I am a helpful AI assistant."`;

const aiCoachChatbotFlow = ai.defineFlow(
  {
    name: 'aiCoachChatbotFlow',
    inputSchema: AiCoachChatbotInputSchema,
    outputSchema: AiCoachChatbotOutputSchema,
  },
  async (input) => {
    // Using gemini-pro as a stable, general-purpose model for this test.
    const response = await ai.generate({
      model: 'googleai/gemini-pro',
      system: systemPrompt,
      prompt: input.message,
    });

    const responseText = response.text;
    if (!responseText) {
      // Return a specific error if the AI gives no response, which is better for debugging.
      throw new Error('AI returned an empty response.');
    }

    return { response: responseText };
  }
);
