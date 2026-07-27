import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Polygon,
  Rect,
  Stop,
} from "react-native-svg";

/**
 * Fondo pastel integrado para mantener disponible la interfaz sin conexión.
 * Los motivos tienen baja opacidad para conservar la legibilidad.
 */
export function ChildBackground() {
  return (
    <View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFillObject}
    >
      <Svg width="100%" height="100%" viewBox="0 0 400 900" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="childBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#F7FCFF" />
            <Stop offset="0.52" stopColor="#FFF9F1" />
            <Stop offset="1" stopColor="#F6FFF7" />
          </LinearGradient>
        </Defs>

        <Rect width="400" height="900" fill="url(#childBg)" />

        <Circle cx="30" cy="150" r="76" fill="#BFE7F5" opacity="0.22" />
        <Circle cx="382" cy="305" r="92" fill="#FFD7C7" opacity="0.2" />
        <Circle cx="42" cy="590" r="88" fill="#D8CEF8" opacity="0.17" />
        <Circle cx="360" cy="760" r="110" fill="#BDECCF" opacity="0.2" />

        <Path
          d="M20 92c7-19 35-18 42 0 17-6 31 4 31 18H-3c0-15 11-24 23-18Z"
          fill="#FFFFFF"
          opacity="0.72"
        />
        <Path
          d="M305 165c8-21 39-20 46 1 20-7 37 5 37 21h-109c0-17 12-28 26-22Z"
          fill="#FFFFFF"
          opacity="0.67"
        />
        <Path
          d="M128 430c7-18 32-18 39 0 17-6 31 4 31 18h-91c0-15 10-24 21-18Z"
          fill="#FFFFFF"
          opacity="0.58"
        />

        <Polygon points="338,72 343,84 356,85 346,94 349,107 338,100 327,107 330,94 320,85 333,84" fill="#F7C95C" opacity="0.38" />
        <Polygon points="78,330 82,340 93,341 85,348 87,359 78,353 69,359 71,348 63,341 74,340" fill="#F7C95C" opacity="0.3" />
        <Polygon points="315,525 319,535 330,536 322,543 324,554 315,548 306,554 308,543 300,536 311,535" fill="#F7C95C" opacity="0.3" />

        <Path d="M47 760c28-25 63-25 91 0 35-36 80-36 116 0 42-38 87-35 146 5v135H0V787c16-2 31-11 47-27Z" fill="#CDEED8" opacity="0.5" />
        <Path d="M0 822c58-45 118-40 171 3 67-54 142-51 229 5v70H0Z" fill="#DDF4E5" opacity="0.82" />
      </Svg>
    </View>
  );
}
