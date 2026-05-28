import { View, Text, Animated, Easing } from "react-native";
import { useEffect, useRef } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import Markdown from "react-native-markdown-display";

// Imports des widgets d'UI riches
import EligibilityBadge from "./widgets/EligibilityBadge";
import DonorStatsCard from "./widgets/DonorStatsCard";
import CentersCarousel from "./widgets/CentersCarousel";
import TimeSlotsGrid from "./widgets/TimeSlotsGrid";
import AppointmentsList from "./widgets/AppointmentsList";
import DonationsHistoryList from "./widgets/DonationsHistoryList";

interface Props {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  onSendMessage?: (text: string) => void;
}

// ─── Animated cursor (ChatGPT-style blinking bar) ────────────────────

function StreamingCursor() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 400, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 400, easing: Easing.linear, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.Text
      style={{ opacity }}
      className="text-[#b80035] font-bold text-[14px]"
    >
      ▎
    </Animated.Text>
  );
}

// ─── Markdown styles ─────────────────────────────────────────────────

const markdownStyle = {
  body: { color: "#1e1e1e", fontSize: 14, lineHeight: 20 },
  heading1: { fontSize: 17, fontWeight: "700" as const, marginBottom: 6, color: "#111" },
  heading2: { fontSize: 15, fontWeight: "600" as const, marginBottom: 4, color: "#222" },
  heading3: { fontSize: 14, fontWeight: "600" as const, color: "#333" },
  paragraph: { marginTop: 0, marginBottom: 8 },
  bullet_list: { marginTop: 2, marginBottom: 2 },
  ordered_list: { marginTop: 2, marginBottom: 2 },
  list_item: { flexDirection: "row" as const, justifyContent: "flex-start" as const, marginTop: 2 },
  bullet_list_icon: { color: "#b80035", marginRight: 6 },
  ordered_list_icon: { color: "#b80035", marginRight: 6 },
  strong: { fontWeight: "600" as const, color: "#111" },
  em: { fontStyle: "italic" as const },
  code_inline: { backgroundColor: "#f3f4f6", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, fontSize: 13, color: "#b80035" },
  code_block: { backgroundColor: "#1e1e1e", borderRadius: 8, padding: 12, marginVertical: 6 },
  fence: { backgroundColor: "#1e1e1e", borderRadius: 8, padding: 12, marginVertical: 6, color: "#e5e7eb" },
  textgroup: { marginTop: 0, marginBottom: 0 },
  blockquote: { borderLeftWidth: 3, borderLeftColor: "#b80035", paddingLeft: 10, marginVertical: 4, opacity: 0.9 },
  link: { color: "#b80035", textDecorationLine: "underline" as const },
};

// ─── Content Parser (XML with JSON Body to Native Widgets) ───────────

interface ContentSegment {
  type: "text" | "widget";
  text?: string;
  widgetName?: string;
  props?: any;
}

function parseContent(content: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  const regex = /<(CentersCarousel|AppointmentsList|DonationsHistoryList|TimeSlotsGrid|EligibilityBadge|DonorStatsCard)>([\s\S]*?)<\/\1>/gi;
  
  let lastIndex = 0;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const matchIndex = match.index;
    const widgetName = match[1];
    const bodyText = match[2].trim();
    
    if (matchIndex > lastIndex) {
      segments.push({
        type: "text",
        text: content.substring(lastIndex, matchIndex),
      });
    }
    
    let props: any = {};
    if (bodyText) {
      try {
        props = JSON.parse(bodyText);
      } catch (e) {
        console.warn(`[parseContent] Failed to parse JSON inside <${widgetName}>:`, e);
        props = { rawData: bodyText };
      }
    }
    
    segments.push({
      type: "widget",
      widgetName,
      props,
    });
    
    lastIndex = regex.lastIndex;
  }
  
  if (lastIndex < content.length) {
    segments.push({
      type: "text",
      text: content.substring(lastIndex),
    });
  }
  
  return segments;
}

// ─── Main Component ──────────────────────────────────────────────────

export default function ChatMessageBubble({ role, content, isStreaming, onSendMessage }: Props) {
  const isUser = role === "user";

  if (isUser) {
    return (
      <View className="flex-row justify-end mb-3 px-4">
        <View className="max-w-[85%] bg-[#b80035] rounded-2xl rounded-br-md px-4 py-2.5 shadow-xs">
          <Text className="text-[14px] leading-[20px] text-white">
            {content}
          </Text>
        </View>
      </View>
    );
  }

  const segments = parseContent(content);

  return (
    <View className="flex-row mb-4 px-4">
      {/* Avatar */}
      <View className="w-7 h-7 rounded-full bg-[#b80035] items-center justify-center mr-3 mt-0.5 flex-shrink-0">
        <MaterialIcons name="favorite" size={14} color="white" />
      </View>

      {/* Content */}
      <View className="flex-1 min-w-0">
        {segments.length > 0 ? (
          <View className="gap-1">
            {segments.map((seg, idx) => {
              if (seg.type === "text" && seg.text) {
                const isLastSegment = idx === segments.length - 1;
                return (
                  <View key={idx} className="flex-row flex-wrap items-end">
                    <View className="flex-1 min-w-0">
                      <Markdown style={markdownStyle}>{seg.text}</Markdown>
                    </View>
                    {isStreaming && isLastSegment && <StreamingCursor />}
                  </View>
                );
              } else if (seg.type === "widget" && seg.widgetName) {
                switch (seg.widgetName) {
                  case "EligibilityBadge":
                    return (
                      <EligibilityBadge
                        key={idx}
                        eligible={seg.props?.eligible ?? seg.props?.complete ?? false}
                        reason={seg.props?.reason ?? (seg.props?.complete ? "Votre profil est complet." : undefined)}
                        missingFields={seg.props?.missingFields}
                        nextDonationDate={seg.props?.nextDonationDate}
                      />
                    );
                  case "DonorStatsCard":
                    return (
                      <DonorStatsCard
                        key={idx}
                        count={seg.props?.count ?? seg.props?.donationCount ?? 0}
                        lives={seg.props?.lives ?? seg.props?.livesSaved}
                        nextDate={seg.props?.nextDate ?? seg.props?.nextDonationDate}
                        bloodType={seg.props?.bloodType}
                      />
                    );
                  case "CentersCarousel":
                    return (
                      <CentersCarousel
                        key={idx}
                        data={seg.props}
                        onSendMessage={onSendMessage}
                      />
                    );
                  case "TimeSlotsGrid":
                    return (
                      <TimeSlotsGrid
                        key={idx}
                        slots={seg.props?.slots ?? seg.props?.availableSlots ?? []}
                        centerId={seg.props?.centerId ?? ""}
                        date={seg.props?.date ?? ""}
                        onSendMessage={onSendMessage}
                      />
                    );
                  case "AppointmentsList":
                    return (
                      <AppointmentsList
                        key={idx}
                        data={seg.props}
                        onSendMessage={onSendMessage}
                      />
                    );
                  case "DonationsHistoryList":
                    return (
                      <DonationsHistoryList
                        key={idx}
                        data={seg.props}
                      />
                    );
                  default:
                    return null;
                }
              }
              return null;
            })}
          </View>
        ) : isStreaming ? (
          <View className="flex-row items-center">
            <View className="w-2 h-5 bg-[#b80035] rounded-sm mr-1 opacity-60" />
            <StreamingCursor />
          </View>
        ) : null}
      </View>
    </View>
  );
}
