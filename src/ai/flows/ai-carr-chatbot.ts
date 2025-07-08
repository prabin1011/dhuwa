'use server';
/**
 * @fileOverview An AI chatbot that embodies Allen Carr's principles to help users quit smoking.
 *
 * - aiCarrChatbot - A function that handles the conversation with the user.
 * - AiCarrChatbotInput - The input type for the aiCarrChatbot function.
 * - AiCarrChatbotOutput - The return type for the aiCarrChatbot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiCarrChatbotInputSchema = z.object({
  message: z.string().describe('The user message to the chatbot.'),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().describe('The history of the conversation.'),
});
export type AiCarrChatbotInput = z.infer<typeof AiCarrChatbotInputSchema>;

const AiCarrChatbotOutputSchema = z.object({
  response: z.string().describe('The chatbot response to the user message.'),
});
export type AiCarrChatbotOutput = z.infer<typeof AiCarrChatbotOutputSchema>;

export async function aiCarrChatbot(input: AiCarrChatbotInput): Promise<AiCarrChatbotOutput> {
  return aiCarrChatbotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiCarrChatbotPrompt',
  input: {schema: AiCarrChatbotInputSchema},
  output: {schema: AiCarrChatbotOutputSchema},
  prompt: `You are an AI chatbot embodying the principles of Allen Carr's "Easy Way to Stop Smoking".
  Your goal is to help the user quit smoking by providing personalized advice and counter-arguments against their nicotine cravings.
  Maintain a direct, psychological conversation, mirroring back their thoughts and challenging their addiction.
  Use a gentle and encouraging tone.

  Here's the conversation history:
  {{#each history}}
    {{#if (eq role \"user\")}}
      User: {{{content}}}
    {{else}}
      Assistant: {{{content}}}
    {{/if}}
  {{/each}}

  User: {{{message}}}
  Assistant: `,
});

const aiCarrChatbotFlow = ai.defineFlow(
  {
    name: 'aiCarrChatbotFlow',
    inputSchema: AiCarrChatbotInputSchema,
    outputSchema: AiCarrChatbotOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {response: output!.response};
  }
);
