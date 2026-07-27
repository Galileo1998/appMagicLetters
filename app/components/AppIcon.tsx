import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import Svg, {
  Circle,
  Line,
  Path,
  Polygon,
  Polyline,
  Rect,
} from "react-native-svg";

type Props = {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Iconos SVG integrados. No dependen de fuentes descargadas por Metro,
 * por lo que también funcionan al abrir la aplicación sin señal.
 */
export function AppIcon({
  name,
  size = 24,
  color = "#222",
  style,
}: Props) {
  const common = {
    fill: "none",
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  let content: React.ReactNode;
  switch (name) {
    case "add":
      content = <Path {...common} d="M12 5v14M5 12h14" />;
      break;
    case "arrow-back":
      content = <Path {...common} d="m15 18-6-6 6-6M9 12h11" />;
      break;
    case "arrow-forward":
    case "chevron-forward":
      content =
        name === "chevron-forward"
          ? <Path {...common} d="m9 18 6-6-6-6" />
          : <Path {...common} d="m9 6 6 6-6 6M4 12h11" />;
      break;
    case "arrow-undo":
      content = <Path {...common} d="M9 7 4 12l5 5M5 12h8a6 6 0 0 1 6 6" />;
      break;
    case "brush":
      content = (
        <>
          <Path {...common} d="m14 4 6 6-8.5 8.5-6-6Z" />
          <Path {...common} d="M5.5 12.5C3 14 4 17 2 20c4 0 7-1 7.5-4.5" />
        </>
      );
      break;
    case "camera":
      content = (
        <>
          <Path {...common} d="M4 8h4l2-3h4l2 3h4v11H4Z" />
          <Circle {...common} cx="12" cy="13" r="3.5" />
        </>
      );
      break;
    case "chatbox-ellipses":
      content = (
        <>
          <Path {...common} d="M4 5h16v12H9l-5 3Z" />
          <Circle cx="9" cy="11" r="1" fill={color} />
          <Circle cx="12" cy="11" r="1" fill={color} />
          <Circle cx="15" cy="11" r="1" fill={color} />
        </>
      );
      break;
    case "checkmark":
      content = <Polyline {...common} points="4,13 9,18 20,6" />;
      break;
    case "cloud-download-outline":
      content = (
        <>
          <Path {...common} d="M7 18H5a4 4 0 0 1 0-8 7 7 0 0 1 13.5-1.5A4.5 4.5 0 0 1 19 17h-2" />
          <Path {...common} d="M12 11v9m-4-4 4 4 4-4" />
        </>
      );
      break;
    case "document-text":
      content = (
        <>
          <Path {...common} d="M6 3h8l4 4v14H6Z" />
          <Path {...common} d="M14 3v5h4M9 12h6M9 16h6" />
        </>
      );
      break;
    case "help-circle":
      content = (
        <>
          <Circle {...common} cx="12" cy="12" r="9" />
          <Path {...common} d="M9.8 9a2.4 2.4 0 1 1 3.7 2c-1 .6-1.5 1-1.5 2.2M12 17h.01" />
        </>
      );
      break;
    case "images":
    case "images-outline":
      content = (
        <>
          <Rect {...common} x="3" y="5" width="15" height="14" rx="2" />
          <Path {...common} d="m5 17 4-4 3 3 2-2 4 4M18 8h3v11H8" />
          <Circle cx="8" cy="9" r="1.2" fill={color} />
        </>
      );
      break;
    case "location-sharp":
      content = (
        <>
          <Path {...common} d="M12 21s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12Z" />
          <Circle {...common} cx="12" cy="9" r="2.5" />
        </>
      );
      break;
    case "lock-closed-outline":
      content = (
        <>
          <Rect {...common} x="5" y="10" width="14" height="11" rx="2" />
          <Path {...common} d="M8 10V7a4 4 0 0 1 8 0v3" />
        </>
      );
      break;
    case "log-out-outline":
      content = <Path {...common} d="M10 5H5v14h5M14 8l4 4-4 4M9 12h9" />;
      break;
    case "paper-plane":
      content = (
        <>
          <Polygon {...common} points="3,11 21,3 15,21 11,13" />
          <Line {...common} x1="11" y1="13" x2="21" y2="3" />
        </>
      );
      break;
    case "people":
      content = (
        <>
          <Circle {...common} cx="9" cy="8" r="3" />
          <Circle {...common} cx="17" cy="9" r="2.5" />
          <Path {...common} d="M3 20c0-4 2-7 6-7s6 3 6 7M14 14c4-1 7 2 7 6" />
        </>
      );
      break;
    case "pencil":
      content = <Path {...common} d="m4 20 4.5-1 10-10-3.5-3.5-10 10ZM14 6.5l3.5 3.5" />;
      break;
    case "qr-code":
      content = (
        <>
          <Rect {...common} x="3" y="3" width="6" height="6" />
          <Rect {...common} x="15" y="3" width="6" height="6" />
          <Rect {...common} x="3" y="15" width="6" height="6" />
          <Path {...common} d="M15 15h3v3h3M15 21v-3M21 12v3" />
        </>
      );
      break;
    case "radio-button-off":
      content = <Circle {...common} cx="12" cy="12" r="8" />;
      break;
    case "resize":
      content = (
        <>
          <Line {...common} x1="5" y1="19" x2="19" y2="5" />
          <Path {...common} d="M13 5h6v6M11 19H5v-6" />
        </>
      );
      break;
    case "square-outline":
      content = <Rect {...common} x="4" y="4" width="16" height="16" rx="1" />;
      break;
    case "tablet-landscape":
      content = (
        <>
          <Rect {...common} x="3" y="6" width="18" height="12" rx="2" />
          <Line {...common} x1="17" y1="6" x2="17" y2="18" />
        </>
      );
      break;
    case "trash":
    case "trash-outline":
      content = <Path {...common} d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" />;
      break;
    default:
      content = <Circle {...common} cx="12" cy="12" r="8" />;
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      {content}
    </Svg>
  );
}
