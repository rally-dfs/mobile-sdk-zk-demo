import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';

export function StandardHeader() {
  return (
    <View style={styles.mainContainer}>
      <View style={styles.itemContainer}>
        <View style={styles.balanceContainer}>
          <Text>8 RLY</Text>
        </View>
        <Image
          source={require('../../assets/images/avatar.png')}
          style={styles.profilePic}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    height: 108,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFF0',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  itemContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    marginTop: 24,
  },
  profilePic: {
    height: 39,
    width: 39,
  },
  balanceContainer: {
    marginRight: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#19191B',
    borderRadius: 20,
  },
});
