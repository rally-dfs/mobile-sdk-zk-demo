import React from 'react';

import {TouchableHighlight, Text, StyleSheet} from 'react-native';

type StandardButtonProps = {
  title: string;
  onPress: () => void;
};

export default function StandardButton(props: StandardButtonProps) {
  return (
    <TouchableHighlight style={styles.standardButton}>
      <Text style={styles.buttonText}>{props.title}</Text>
    </TouchableHighlight>
  );
}

const styles = StyleSheet.create({
  standardButton: {
    borderColor: '#19191B',
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 8,
  },
  buttonText: {
    color: '#19191B',
    fontSize: 16,
  },
});
