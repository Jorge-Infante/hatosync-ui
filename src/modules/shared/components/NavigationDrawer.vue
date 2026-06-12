<template>
  <v-navigation-drawer
    v-model="drawerState"
    :rail="isRail"
    :permanent="!mobile"
    :temporary="mobile"
    :location="location"
    :width="width"
    :rail-width="railWidth"
  >
    <v-list-item
      v-if="title || subtitle"
      :prepend-avatar="avatar"
      :title="title"
      :subtitle="subtitle"
      class="pa-2"
    >
      <template #append>
        <v-btn
          v-if="!mobile && rail"
          :icon="isRail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
          variant="text"
          size="small"
          @click.stop="isRail = !isRail"
        />
      </template>
    </v-list-item>

    <v-divider v-if="title || subtitle" />

    <v-list density="compact" nav>
      <template v-for="(item, i) in items" :key="i">
        <v-list-group
          v-if="item.children && item.children.length"
          :value="item.title"
        >
          <template #activator="{ props: activatorProps }">
            <v-list-item
              v-bind="activatorProps"
              :prepend-icon="item.icon"
              :title="item.title"
            />
          </template>

          <v-list-item
            v-for="(child, j) in item.children"
            :key="`${i}-${j}`"
            :prepend-icon="child.icon"
            :title="child.title"
            :to="child.to"
            :href="child.href"
            :value="child.title"
            @click="onItemClick(child)"
          />
        </v-list-group>

        <v-list-item
          v-else
          :prepend-icon="item.icon"
          :title="item.title"
          :to="item.to"
          :href="item.href"
          :value="item.title"
          @click="onItemClick(item)"
        />
      </template>
    </v-list>

    <template #append>
      <div class="pa-2">
        <slot name="append" />
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script>
import { useDisplay } from "vuetify";

export default {
  name: "NavigationDrawer",
  props: {
    modelValue: {
      type: Boolean,
      default: null,
    },
    items: {
      type: Array,
      required: true,
      default: () => [],
    },
    title: {
      type: String,
      default: "",
    },
    subtitle: {
      type: String,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "left",
    },
    width: {
      type: [Number, String],
      default: 260,
    },
    railWidth: {
      type: [Number, String],
      default: 56,
    },
    rail: {
      type: Boolean,
      default: true,
    },
  },
  emits: ["update:modelValue", "item-click"],
  setup() {
    const { mobile } = useDisplay();
    return { mobile };
  },
  data() {
    return {
      internalDrawer: true,
      isRail: false,
    };
  },
  computed: {
    drawerState: {
      get() {
        return this.modelValue !== null ? this.modelValue : this.internalDrawer;
      },
      set(value) {
        this.internalDrawer = value;
        this.$emit("update:modelValue", value);
      },
    },
  },
  watch: {
    mobile: {
      immediate: true,
      handler(isMobile) {
        this.internalDrawer = !isMobile;
        if (isMobile) this.isRail = false;
      },
    },
  },
  methods: {
    onItemClick(item) {
      this.$emit("item-click", item);
      if (this.mobile) this.internalDrawer = false;
    },
  },
};
</script>
