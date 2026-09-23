<template>
  <Header>
    <div class="left">
      <logo></logo>
      <Divider type="vertical" />

      <!-- 导入 -->
      <import-Json></import-Json>
      <Divider type="vertical" />
      <import-file></import-file>
      <Divider type="vertical" />
      <Button type="text" to="/template" target="_blank">全部模板</Button>
      <Divider type="vertical" />

      <myTemplName></myTemplName>
      <!-- 标尺开关 -->
      <Tooltip :content="$t('grid')">
        <iSwitch v-model="toggleModel" size="small" class="switch"></iSwitch>
      </Tooltip>
      <Divider type="vertical" />
      <history></history>
    </div>

    <div class="right">
      <!-- 美颜 -->
      <Button type="text" icon="md-color-palette" @click="openBeauty">
        {{ $t('beauty.title') }}
      </Button>
      <!-- 一键工具 -->
      <Dropdown trigger="click" @on-click="openEnhance">
        <Button type="text" icon="ios-color-wand">{{ $t('enhance.title') }}</Button>
        <template #list>
          <DropdownMenu>
            <DropdownItem name="brighten">{{ $t('enhance.brighten') }}</DropdownItem>
            <DropdownItem name="print">{{ $t('enhance.print') }}</DropdownItem>
            <DropdownItem name="frame">{{ $t('enhance.frame') }}</DropdownItem>
            <DropdownItem name="removeBg">{{ $t('enhance.removeBg') }}</DropdownItem>
            <DropdownItem name="effects">{{ $t('enhance.effects') }}</DropdownItem>
          </DropdownMenu>
        </template>
      </Dropdown>
      <!-- 管理员模式 -->
      <admin />
      <!-- 预览 -->
      <previewCurrent />
      <waterMark />
      <save></save>
      <login></login>
      <lang></lang>
    </div>
  </Header>
</template>

<script name="Top" setup lang="ts">
// 导入元素
import importJson from '@/components/importJSON.vue';
import importFile from '@/components/importFile.vue';

// 顶部组件
import logo from '@/components/logo.vue';
import myTemplName from '@/components/myTemplName.vue';
import previewCurrent from '@/components/previewCurrent';
import save from '@/components/save.vue';
import lang from '@/components/lang.vue';
import waterMark from '@/components/waterMark.vue';
import login from '@/components/login';
import admin from '@/components/admin';
import history from '@/components/history.vue';

const props = defineProps(['ruler']);
const emit = defineEmits(['update:ruler']);

const toggleModel = computed({
  get() {
    return props.ruler;
  },
  set(value) {
    emit('update:ruler', value);
  },
});

// 打开美颜面板
const openBeauty = () => {
  window.dispatchEvent(new CustomEvent('beauty-open'));
};

// 打开一键工具面板
const openEnhance = (name) => {
  window.dispatchEvent(new CustomEvent('enhance-open', { detail: name }));
};
</script>

<style lang="less" scoped>
.left,
.right {
  display: flex;
  align-items: center;
  img {
    display: block;
    margin-right: 10px;
  }
}
</style>
