'use server';

import OpenAI from 'openai';
import type { Message } from '@/components/chatbot/chat-message';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemMessage = {
  role: 'system' as const,
  content: `You are an AI Chatbot designed to simulate a direct, psychological conversation based on Allen Carr's "Easy Way" principles to help people quit smoking. Your purpose is to analyze user inputs, mirror back their thoughts, and provide gentle but firm counter-arguments to the logic of nicotine addiction. Do not lecture. Instead, ask probing questions and guide the user to their own conclusions, reinforcing the idea that quitting is not a sacrifice but a release from a trap. Your tone should be calm, empathetic, and encouraging, like a supportive friend who has already found freedom from smoking.`,
};

export async function getChatResponse(messages: Message[]): Promise<Message> {
    const apiMessages = messages
        .filter(message => typeof message.content === 'string')
        .map(message => ({
            role: message.role,
            content: message.content as string,
        }));

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [systemMessage, ...apiMessages],
    });

    const aiMessageContent = response.choices[0]?.message?.content;

    if (aiMessageContent) {
        return { role: 'assistant', content: aiMessageContent };
    } else {
        return { role: 'assistant', content: "I'm sorry, I couldn't generate a response. Please try again." };
    }
  } catch (error) {
    console.error("Error getting chat response from OpenAI:", error);
    return { role: 'assistant', content: 'An error occurred while connecting to the AI. Please check the API key and try again.' };
  }
}
