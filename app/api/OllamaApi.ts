import {OLLAMA_SERVER} from '../constants/eburon';
import type {PullResponse, PullSessionType} from '../model/Pull';
import type {OllamaTagResponse} from '../model/Tag';
import type {OllamaPsResponse} from '../model/Ps';
import type {ChatResponse, ChatSessionType, Message} from '../model/Chat';

export function pull(
  modelName: string,
  pullResponseCallback: (response: PullResponse) => void,
): PullSessionType {
  const xhr = new XMLHttpRequest();

  const promise: Promise<void> = new Promise((resolve, reject) => {
    let buffer = '';

    xhr.open('POST', `${OLLAMA_SERVER}/api/pull`);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onprogress = function () {
      const chunk = xhr.responseText.substring(buffer.length);
      buffer += chunk;

      for (const line of chunk.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          pullResponseCallback(JSON.parse(trimmed));
        } catch {
          // ignore incomplete lines
        }
      }
    };

    xhr.onload = function () {
      if (xhr.status === 200) {
        resolve();
      } else {
        reject(new Error(`HTTP Error: ${xhr.status}`));
      }
    };

    xhr.onerror = function () {
      reject(new Error('Network Error'));
    };

    xhr.send(JSON.stringify({model: modelName, stream: true}));
  });

  return {
    promise,
    abort: () => {
      xhr.abort();
    },
  };
}

export const tags = async (): Promise<OllamaTagResponse> => {
  const response = await fetch(`${OLLAMA_SERVER}/api/tags`);
  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }
  return await response.json();
};

export const loadModel = async (modelName: string): Promise<void> => {
  const response = await fetch(`${OLLAMA_SERVER}/api/chat`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({model: modelName}),
  });
  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }
};

export function chat(
  modelName: string,
  messages: Message[],
  chatResponseCallback: (chatResponse: ChatResponse) => void,
): ChatSessionType {
  const xhr = new XMLHttpRequest();

  const promise: Promise<void> = new Promise((resolve, reject) => {
    let buffer = '';

    xhr.open('POST', `${OLLAMA_SERVER}/api/chat`);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onprogress = function () {
      const chunk = xhr.responseText.substring(buffer.length);
      buffer += chunk;

      for (const line of chunk.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const response: ChatResponse = JSON.parse(trimmed);
          chatResponseCallback(response);
        } catch {
          // ignore incomplete lines
        }
      }
    };

    xhr.onload = function () {
      if (xhr.status === 200) {
        resolve();
      } else {
        reject(new Error(`HTTP Error: ${xhr.status}`));
      }
    };

    xhr.onerror = function () {
      reject(new Error('Network Error'));
    };

    xhr.send(JSON.stringify({model: modelName, messages, stream: true}));
  });

  return {
    promise,
    abort: () => {
      xhr.abort();
    },
  };
}

export const ps = async (): Promise<OllamaPsResponse> => {
  const response = await fetch(`${OLLAMA_SERVER}/api/ps`);
  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }
  return await response.json();
};

export const deleteModel = async (modelName: string): Promise<void> => {
  const response = await fetch(`${OLLAMA_SERVER}/api/delete`, {
    method: 'DELETE',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({model: modelName}),
  });
  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }
};
