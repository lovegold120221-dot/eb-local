import React, {createContext, useContext, useMemo} from 'react';
import {useColorScheme} from 'react-native';
import {
  MD3LightTheme,
  MD3DarkTheme,
  Provider as PaperProvider,
} from 'react-native-paper';

const EburonLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1a1a2e',
    secondary: '#16213e',
    background: '#ffffff',
    surface: '#f5f5f5',
    error: '#e74c3c',
  },
};

const EburonDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#e94560',
    secondary: '#0f3460',
    background: '#0a0a0a',
    surface: '#1a1a1a',
    error: '#e74c3c',
  },
};

const ThemeContext = createContext(EburonDarkTheme);

export function Material3ThemeProvider({children}: {children: React.ReactNode}) {
  const colorScheme = useColorScheme();
  const theme = useMemo(
    () => (colorScheme === 'dark' ? EburonDarkTheme : EburonLightTheme),
    [colorScheme],
  );

  return (
    <ThemeContext.Provider value={theme}>
      <PaperProvider theme={theme}>{children}</PaperProvider>
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
