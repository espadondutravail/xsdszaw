export { type Response, ResponseSchema } from "./chain";

export {
  AiOperationsSchema,
  type AiOperations,
  WsOperationsSchema,
  type WsOperations,
} from "./shared";

// Operations.

import {
  aiOperation as editStylesAiOperation,
  wsOperation as editStylesWsOperation,
} from "./edit-styles";
export const editStyles = {
  aiOperation: editStylesAiOperation,
  wsOperation: editStylesWsOperation,
};
export type editStyles = {
  aiOperation: editStylesAiOperation;
  wsOperation: editStylesWsOperation;
};

import {
  aiOperation as generateTemplatePromptAiOperation,
  wsOperation as generateTemplatePromptWsOperation,
} from "./generate-template-prompt";
export const generateTemplatePrompt = {
  aiOperation: generateTemplatePromptAiOperation,
  wsOperation: generateTemplatePromptWsOperation,
};
export type generateTemplatePrompt = {
  aiOperation: editStylesAiOperation;
  wsOperation: editStylesWsOperation;
};

import {
  aiOperation as generateInsertTemplateAiOperation,
  wsOperation as generateInsertTemplateWsOperation,
} from "./generate-insert-template";
export const generateInsertTemplate = {
  aiOperation: generateInsertTemplateAiOperation,
  wsOperation: generateInsertTemplateWsOperation,
};
export type generateInsertTemplate = {
  aiOperation: editStylesAiOperation;
  wsOperation: editStylesWsOperation;
};

import {
  aiOperation as deleteInstanceAiOperation,
  wsOperation as deleteInstanceWsOperation,
} from "./delete-instance";
export const deleteInstance = {
  aiOperation: deleteInstanceAiOperation,
  wsOperation: deleteInstanceWsOperation,
};
export type deleteInstance = {
  aiOperation: editStylesAiOperation;
  wsOperation: editStylesWsOperation;
};
