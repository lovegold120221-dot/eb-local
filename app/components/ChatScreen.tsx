import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import 'react-native-get-random-values';
import {v4 as uuidv4} from 'uuid';
import {chat} from '../api/OllamaApi';
import {EBURON_MODEL} from '../constants/eburon';
import {useAppTheme} from '../theme/ThemeContext';
import type {Message, ChatResponse, ChatSessionType} from '../model/Chat';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {auth} from '../firebase/firebase';
import {signOut} from 'firebase/auth';

export default function ChatScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');
  const [chatting, setChatting] = useState(false);
  const messagesRef = useRef<Message[]>([]);
  const chatSessionRef = useRef<ChatSessionType | null>(null);
  const flatListRef = useRef<FlatList<Message>>(null);
  const [, forceUpdate] = useState({});
  const conversationId = useRef(uuidv4());

  function handleSend() {
    if (chatting) {
      chatSessionRef.current?.abort();
      setChatting(false);
      return;
    }
    if (!message.trim()) return;

    setChatting(true);
    const userMsg: Message = {role: 'user', content: message.trim()};
    messagesRef.current = [...messagesRef.current, userMsg];
    forceUpdate({});
    setMessage('');

    let addedAssistantMessage = false;

    chatSessionRef.current = chat(
      EBURON_MODEL,
      messagesRef.current,
      (response: ChatResponse) => {
        if (response.error) return;
        if (!response.done) {
          if (addedAssistantMessage) {
            messagesRef.current[messagesRef.current.length - 1].content +=
              response.message?.content ?? '';
          } else {
            addedAssistantMessage = true;
            messagesRef.current = [
              ...messagesRef.current,
              response.message ?? {role: 'assistant', content: ''},
            ];
          }
          forceUpdate({});
        }
      },
    );

    chatSessionRef.current.promise.catch(() => {}).finally(() => {
      setChatting(false);
      chatSessionRef.current = null;
    });
  }

  async function handleLogout() {
    try {
      await signOut(auth);
    } catch {}
  }

  function renderMessage({item}: {item: Message}) {
    const isUser = item.role === 'user';
    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.userRow : styles.botRow,
        ]}>
        <View
          style={[
            styles.messageBubble,
            isUser
              ? {backgroundColor: theme.colors.primary}
              : {backgroundColor: theme.colors.surface},
          ]}>
          <Text
            style={{
              color: isUser ? '#fff' : theme.colors.onSurface,
              fontSize: 15,
              lineHeight: 22,
            }}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background, paddingTop: insets.top}]}>
      <View style={[styles.header, {backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.surfaceVariant}]}>
        <Text style={[styles.headerTitle, {color: theme.colors.onSurface}]}>
          Eburon Max
        </Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={[styles.logoutText, {color: theme.colors.error}]}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messagesRef.current}
        renderItem={renderMessage}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({animated: true})
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View
          style={[
            styles.inputBar,
            {backgroundColor: theme.colors.surface, borderTopColor: theme.colors.surfaceVariant},
          ]}>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.colors.background,
                color: theme.colors.onSurface,
              },
            ]}
            placeholder="Message Eburon Max..."
            placeholderTextColor="#888"
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {backgroundColor: chatting ? theme.colors.error : theme.colors.primary},
            ]}
            onPress={handleSend}>
            <Text style={styles.sendText}>
              {chatting ? 'Stop' : 'Send'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  logoutButton: {
    position: 'absolute',
    right: 16,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '500',
  },
  messageList: {
    padding: 12,
    flexGrow: 1,
  },
  messageRow: {
    marginVertical: 4,
  },
  userRow: {
    alignItems: 'flex-end',
  },
  botRow: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    borderBottomRightRadius: 4,
  },
  inputBar: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sendText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
