<template>
  <div class="common-layout">
    <el-container>
      <el-aside width="200px">
        <el-menu default-active="2" class="el-menu-vertical-demo">
          <el-menu-item index="1">
            <router-link to="/home">首页</router-link>
          </el-menu-item>
          <el-menu-item-group title="webrtc">
            <el-menu-item index="2">
              <router-link to="/webrtc/one2one">one2one</router-link>
            </el-menu-item>
          </el-menu-item-group>
        </el-menu>
      </el-aside>
      <el-main>
        <router-view></router-view>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
.common-layout {
  height: 100%;
  .el-container {
    height: 100%;
  }
  .el-aside,
  .el-menu-item {
    background-color: var(--el-color-primary-light-8);
    color: var(--el-text-color-primary);
  }
  .el-main {
    background-color: var(--el-color-primary-light-9);
    color: var(--el-text-color-primary);
  }
}
</style>
