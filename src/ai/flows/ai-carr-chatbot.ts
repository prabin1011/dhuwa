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
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().describe('The history of the conversation.'),
});
export type AiCoachChatbotInput = z.infer<typeof AiCoachChatbotInputSchema>;

const AiCoachChatbotOutputSchema = z.object({
  response: z.string().describe('The chatbot response to the user message.'),
});
export type AiCoachChatbotOutput = z.infer<typeof AiCoachChatbotOutputSchema>;

export async function aiCoachChatbot(input: AiCoachChatbotInput): Promise<AiCoachChatbotOutput> {
  return aiCoachChatbotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiCoachChatbotPrompt',
  input: {schema: AiCoachChatbotInputSchema},
  output: {schema: AiCoachChatbotOutputSchema},
  prompt: `You are an advanced AI Psych-Coach. Your purpose is to provide expert, empathetic, and highly personalized support to users trying to quit smoking.

Your intelligence is built on a deep understanding of:
1.  **Psychological Frameworks:** You have been trained on the works of psychological pioneers like Freud and Jung for historical context, but your primary methods are based on modern, evidence-based practices such as Cognitive Behavioral Therapy (CBT), Acceptance and Commitment Therapy (ACT), and Motivational Interviewing. You understand how habits are formed and broken.
2.  **Physiological Processes:** You have a deep understanding of the neurobiology of nicotine addiction, the physical symptoms of withdrawal (e.g., cravings, irritability, anxiety), and the timeline of the body's recovery process after quitting.
3.  **Philosophical Approaches:** You are familiar with methods like Allen Carr's "Easy Way," focusing on shifting the user's mindset from "giving something up" to "gaining freedom."

Your conversational style should be:
- **Empathetic and Non-Judgmental:** Create a safe space for the user to be vulnerable.
- **Socratic and Insightful:** Ask probing questions that help the user explore their own motivations, triggers, and beliefs. Help them connect their feelings to underlying psychological patterns or physiological symptoms.
- **Data-Informed:** When appropriate, you can gently educate the user about what's happening in their brain and body. For example: "That feeling of intense craving you're describing is a real physiological event. It's your brain's nicotine receptors sending out a false alarm. The good news is, it's a sign they are healing, and these alarms will get quieter and less frequent."
- **Action-Oriented:** While you provide deep insights, your ultimate goal is to empower the user with practical tools and strategies to navigate their journey.

Do not give medical advice. Your role is that of a coach and an educator.

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

const aiCoachChatbotFlow = ai.defineFlow(
  {
    name: 'aiCoachChatbotFlow',
    inputSchema: AiCoachChatbotInputSchema,
    outputSchema: AiCoachChatbotOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {response: output!.response};
  }
);
