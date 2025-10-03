'use server';

/**
 * @fileOverview An AI agent that suggests intelligent responses based on the current conversation.
 *
 * - getIntelligentResponseSuggestions - A function that generates suggested replies.
 * - IntelligentResponseSuggestionsInput - The input type for the getIntelligentResponseSuggestions function.
 * - IntelligentResponseSuggestionsOutput - The return type for the getIntelligentResponseSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentResponseSuggestionsInputSchema = z.object({
  conversationHistory: z
    .string()
    .describe('The history of the conversation to provide context for generating response suggestions.'),
  numberOfSuggestions: z
    .number()
    .default(3)
    .describe('The number of response suggestions to generate.'),
});

export type IntelligentResponseSuggestionsInput = z.infer<
  typeof IntelligentResponseSuggestionsInputSchema
>;

const IntelligentResponseSuggestionsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('An array of suggested replies based on the conversation history.'),
});

export type IntelligentResponseSuggestionsOutput = z.infer<
  typeof IntelligentResponseSuggestionsOutputSchema
>;

export async function getIntelligentResponseSuggestions(
  input: IntelligentResponseSuggestionsInput
): Promise<IntelligentResponseSuggestionsOutput> {
  return intelligentResponseSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentResponseSuggestionsPrompt',
  input: {schema: IntelligentResponseSuggestionsInputSchema},
  output: {schema: IntelligentResponseSuggestionsOutputSchema},
  prompt: `You are an AI assistant designed to provide intelligent and contextually relevant response suggestions for ongoing conversations.

  Given the following conversation history:
  {{conversationHistory}}

  Generate {{numberOfSuggestions}} suggested replies that the user can quickly use to respond. The suggestions should be short, relevant, and helpful in continuing the conversation. Vary the suggestions to provide a range of options.

  Your output should be an array of strings, where each string is a suggested reply.`,
});

const intelligentResponseSuggestionsFlow = ai.defineFlow(
  {
    name: 'intelligentResponseSuggestionsFlow',
    inputSchema: IntelligentResponseSuggestionsInputSchema,
    outputSchema: IntelligentResponseSuggestionsOutputSchema,
  },
  async (input: IntelligentResponseSuggestionsInput) => {
    const {output} = await prompt(input);
    return output!;
  }
);
