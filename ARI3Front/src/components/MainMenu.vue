<template>
  <el-menu
    class="el-menu-demo"
    mode="horizontal"
    @select="0"
    background-color="#545c64"
    text-color="#fff"
    active-text-color="#ffd04b"
  >
    <el-submenu index="1" :showTimeout="0">
      <template slot="title">Pages</template>
      <router-link to="/">
        <el-menu-item index="0">Home</el-menu-item>
      </router-link>
      <router-link to="/about">
        <el-menu-item index="1">About</el-menu-item>
      </router-link>
      <router-link to="/develop">
        <el-menu-item index="2">Develop</el-menu-item>
      </router-link>
    </el-submenu>
    <el-submenu index="0" :showTimeout="0">
      <template slot="title">File</template>
      <el-menu-item index="2-1">Open</el-menu-item>
      <el-menu-item index="2-2">Save</el-menu-item>
      <el-menu-item index="2-3">Save as...</el-menu-item>
      <el-submenu index="2-4" :showTimeout="0">
        <template slot="title">Open recent...</template>
        <el-menu-item index="2-4-1">TestProject1</el-menu-item>
        <el-menu-item index="2-4-2">TestProject2</el-menu-item>
      </el-submenu>
    </el-submenu>
    <div class="onlineClass" @click="handleClick">
      <el-badge
        class="item"
        :value="online.v ? 'Connected: ' +  tmpCount : 'Disconnected' +  tmpCount"
        :type="online.v ? 'success' : 'danger'"
      ></el-badge>
    </div>
  </el-menu>
</template>

<script>
// import { appState } from "../services/AppState";
import { Observable, Subject, interval } from "rxjs"
import { map, filter } from "rxjs/operators"


export default {
  name: "MainMenu",
  methods: {
    handleClick: function() {
      console.log("bum bum");
      this.online.v ^= true;
    }
  },
  subscriptions: {
		tmpCount: interval(1000)
  },
  data: function() {
    return {
      online: this.$root.appState.WebSocket.outs.connected
    };
  },
  mounted: () => {}
};
</script>

<style lang="less">
.onlineClass {
  text-align: right;
}
</style>
