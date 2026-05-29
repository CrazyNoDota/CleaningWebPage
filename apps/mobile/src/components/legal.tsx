import { ScrollView, Text, View } from 'react-native';
import { Screen } from '@/components/ui';
import { useTheme } from '@/lib/theme-provider';

export type LegalSection = {
  h: string;
  p?: string;
  list?: string[];
};

export function LegalDoc({
  title,
  updated,
  sections,
}: {
  title: string;
  updated: string;
  sections: LegalSection[];
}) {
  const t = useTheme();
  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ padding: t.space[4], paddingBottom: t.space[8], gap: t.space[5] }}>
        <View style={{ gap: t.space[1] }}>
          <Text style={{ color: t.color.ink.primary, fontSize: 28, fontWeight: '800', lineHeight: 34 }}>
            {title}
          </Text>
          <Text style={{ color: t.color.ink.tertiary, fontSize: t.type.bodySm.fontSize }}>{updated}</Text>
        </View>

        {sections.map((s) => (
          <View key={s.h} style={{ gap: t.space[2] }}>
            <Text style={{ color: t.color.ink.primary, fontSize: t.type.titleSm.fontSize, fontWeight: '800' }}>
              {s.h}
            </Text>
            {s.p && (
              <Text style={{ color: t.color.ink.secondary, fontSize: t.type.bodyMd.fontSize, lineHeight: 24 }}>
                {s.p}
              </Text>
            )}
            {s.list && (
              <View style={{ gap: 6 }}>
                {s.list.map((item) => (
                  <View key={item} style={{ flexDirection: 'row', gap: t.space[2], alignItems: 'flex-start' }}>
                    <View
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 3,
                        backgroundColor: t.color.brand[500],
                        marginTop: 9,
                      }}
                    />
                    <Text
                      style={{
                        color: t.color.ink.secondary,
                        fontSize: t.type.bodyMd.fontSize,
                        lineHeight: 24,
                        flex: 1,
                      }}
                    >
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
