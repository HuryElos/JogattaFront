import IntlPolyfill from 'intl';
import 'intl/locale-data/jsonp/pt-BR';

// Garantir que temos o Intl disponível globalmente
if (!global.Intl) {
    global.Intl = IntlPolyfill;
}

// Configuração do locale padrão
if (Intl.DateTimeFormat) {
    Intl.DateTimeFormat.prototype.formatToParts = Intl.DateTimeFormat.prototype.formatToParts || function() {
        return [];
    };
}