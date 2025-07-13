import { Text as RNText } from 'react-native';
import React from 'react';

// @ts-expect-error: We're overriding internal render, safe in this context
const oldRender = RNText.render;

// @ts-expect-error
RNText.render = function (...args: any) {
  const origin = oldRender.apply(this, args);
  return React.cloneElement(origin, {
    style: [
      { fontFamily: 'SFPro', color: '#fff' }, // Dodano kolor biały
      origin.props?.style,
    ],
  });
};
