import { NavigationProp } from '@react-navigation/native';
import { Amigo } from './amigos';

export type Fluxo = 'offline' | 'online' | 'manual' | 'manual2' | 'habilidades' | 'automatico';

export type RootStackParamList = {
  Login: undefined;
  ConvidarAmigos: { fluxo?: Fluxo };
  JogosFlow: {
    screen: string;
    params: {
      amigosSelecionados?: Amigo[];
      players?: Amigo[];
      fluxo: Fluxo;
    };
  };
};

export type AppNavigationProp = NavigationProp<RootStackParamList>; 