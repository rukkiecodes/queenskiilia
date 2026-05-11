import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';

import { PortfolioItemCard } from '@/components/cards/portfolio-item-card';
import { EmptyState } from '@/components/empty-state';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { useMyPortfolio } from '@/hooks/use-portfolio';
import { GraphQLError } from '@/lib/graphql-client';

type Layout = 'list' | 'grid';

export default function StudentPortfolio() {
  const router = useRouter();
  const { data, isLoading, isFetching, error, refetch } = useMyPortfolio();
  const [layout, setLayout] = useState<Layout>('list');

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      data={data ?? []}
      key={layout} // force re-layout when toggle changes (FlatList caches numColumns)
      keyExtractor={(p) => p.id}
      numColumns={layout === 'grid' ? 2 : 1}
      columnWrapperStyle={layout === 'grid' ? { gap: spacing.sm } : undefined}
      contentContainerStyle={{
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xxxl,
        gap: spacing.sm,
        flexGrow: 1,
      }}
      style={{ flex: 1, backgroundColor: colors.canvas }}
      ListHeaderComponent={
        <View
          style={{
            paddingVertical: spacing.sm,
            flexDirection: 'row',
            justifyContent: 'flex-end',
          }}
        >
          <LayoutToggle layout={layout} onChange={setLayout} />
        </View>
      }
      renderItem={({ item }) => (
        <View
          style={{
            flex: layout === 'grid' ? 1 : undefined,
            maxWidth: layout === 'grid' ? '50%' : undefined,
          }}
        >
          <PortfolioItemCard
            item={item}
            layout={layout}
            showVisibility
            onPress={() =>
              router.push({
                pathname: '/(shared)/portfolio/[itemId]',
                params: { itemId: item.id },
              })
            }
          />
        </View>
      )}
      refreshControl={
        <RefreshControl
          refreshing={isFetching}
          onRefresh={refetch}
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={
        isLoading ? (
          <View style={{ paddingVertical: spacing.xxxl, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error ? (
          <EmptyState
            icon="exclamationmark.triangle"
            title="Could not load portfolio"
            body={
              error instanceof GraphQLError ? error.message : 'Pull to retry.'
            }
          />
        ) : (
          <EmptyState
            icon="folder"
            title="No portfolio items yet"
            body="Complete your first project to start your portfolio. Approved work auto-creates an entry here."
          />
        )
      }
    />
  );
}

function LayoutToggle({
  layout,
  onChange,
}: {
  layout: Layout;
  onChange: (l: Layout) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.hairline,
        backgroundColor: colors.canvas,
        padding: 2,
      }}
    >
      <ToggleButton
        icon="list.bullet"
        active={layout === 'list'}
        onPress={() => onChange('list')}
      />
      <ToggleButton
        icon="square.grid.2x2"
        active={layout === 'grid'}
        onPress={() => onChange('grid')}
      />
    </View>
  );
}

function ToggleButton({
  icon,
  active,
  onPress,
}: {
  icon: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.xxs + spacing.xxs,
        borderRadius: radius.pill,
        backgroundColor: active ? colors.primary : 'transparent',
        opacity: pressed && !active ? 0.6 : 1,
      })}
    >
      <Image
        source={`sf:${icon}`}
        tintColor={active ? colors.onPrimary : colors.ink}
        style={{ width: 16, height: 16 }}
      />
    </Pressable>
  );
}

