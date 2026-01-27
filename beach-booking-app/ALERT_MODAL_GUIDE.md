# Guida all'uso del Modal Alert Globale

## Importazione

```tsx
import { useAlert } from './src/context/AlertContext';
```

## Utilizzo base

```tsx
function MioComponente() {
  const { showAlert } = useAlert();

  const mostraSuccesso = () => {
    showAlert({
      title: 'Operazione completata',
      message: 'I tuoi dati sono stati salvati con successo!',
      type: 'success'
    });
  };

  const mostraErrore = () => {
    showAlert({
      title: 'Errore',
      message: 'Non è stato possibile completare l\'operazione.',
      type: 'error'
    });
  };

  const mostraAvviso = () => {
    showAlert({
      title: 'Attenzione',
      message: 'Questa azione potrebbe avere delle conseguenze.',
      type: 'warning'
    });
  };

  const mostraInfo = () => {
    showAlert({
      title: 'Informazione',
      message: 'Questo è un messaggio informativo.',
      type: 'info'
    });
  };

  return (
    <View>
      <Button title="Successo" onPress={mostraSuccesso} />
      <Button title="Errore" onPress={mostraErrore} />
      <Button title="Avviso" onPress={mostraAvviso} />
      <Button title="Info" onPress={mostraInfo} />
    </View>
  );
}
```

## Alert con conferma e annullamento

```tsx
const eliminaElemento = () => {
  showAlert({
    title: 'Conferma eliminazione',
    message: 'Sei sicuro di voler eliminare questo elemento?',
    type: 'warning',
    showCancel: true,
    confirmText: 'Elimina',
    cancelText: 'Annulla',
    onConfirm: () => {
      // Esegui l'eliminazione
      console.log('Elemento eliminato');
    },
    onCancel: () => {
      console.log('Operazione annullata');
    }
  });
};
```

## Tipi disponibili

- **info** (default): colore blu, icona informativa
- **success**: colore verde, icona di spunta
- **warning**: colore arancione, icona di avviso
- **error**: colore rosso, icona di errore

## Proprietà

| Proprietà | Tipo | Obbligatorio | Default | Descrizione |
|-----------|------|--------------|---------|-------------|
| title | string | ✅ | - | Titolo dell'alert |
| message | string | ✅ | - | Messaggio dell'alert |
| type | 'info' \| 'success' \| 'warning' \| 'error' | ❌ | 'info' | Tipo di alert |
| confirmText | string | ❌ | 'OK' | Testo del pulsante di conferma |
| cancelText | string | ❌ | 'Annulla' | Testo del pulsante di annullamento |
| showCancel | boolean | ❌ | false | Mostra il pulsante di annullamento |
| onConfirm | () => void | ❌ | - | Callback quando viene premuto il pulsante di conferma |
| onCancel | () => void | ❌ | - | Callback quando viene premuto il pulsante di annullamento |

## Esempio completo in uno screen

```tsx
import React from 'react';
import { View, Button, StyleSheet } from 'react-native';
import { useAlert } from '../context/AlertContext';

export default function EsempioScreen() {
  const { showAlert } = useAlert();

  const handleSalva = async () => {
    try {
      // Simula un'operazione asincrona
      await salvaUtente();
      
      showAlert({
        title: 'Successo!',
        message: 'Profilo aggiornato correttamente',
        type: 'success'
      });
    } catch (error) {
      showAlert({
        title: 'Errore',
        message: 'Impossibile salvare le modifiche. Riprova più tardi.',
        type: 'error'
      });
    }
  };

  const handleElimina = () => {
    showAlert({
      title: 'Conferma eliminazione',
      message: 'Questa azione è irreversibile. Vuoi procedere?',
      type: 'warning',
      showCancel: true,
      confirmText: 'Elimina',
      cancelText: 'Annulla',
      onConfirm: async () => {
        try {
          await eliminaAccount();
          showAlert({
            title: 'Account eliminato',
            message: 'Il tuo account è stato eliminato con successo.',
            type: 'success'
          });
        } catch (error) {
          showAlert({
            title: 'Errore',
            message: 'Non è stato possibile eliminare l\'account.',
            type: 'error'
          });
        }
      }
    });
  };

  return (
    <View style={styles.container}>
      <Button title="Salva modifiche" onPress={handleSalva} />
      <Button title="Elimina account" onPress={handleElimina} color="red" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    gap: 20,
  },
});
```

## Caratteristiche

✨ **Animazione fluida**: Spring animation per l'apertura con fade in overlay  
🎨 **Stile moderno**: Design coerente con l'app esistente  
📱 **Responsive**: Si adatta a tutte le dimensioni dello schermo  
♿ **Accessibile**: Supporto per screen reader e chiusura con back button  
🔄 **Globale**: Disponibile in tutta l'app senza prop drilling  
🎭 **Customizzabile**: Testi, colori e callback personalizzabili
