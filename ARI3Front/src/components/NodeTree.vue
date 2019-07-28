<template>
  <div class="custom-tree-container">
    <div class="block">
      <el-tree
        :data="data5"
        :props="defaultProps"
        node-key="name"
        default-expand-all
        highlight-current
      >
        <span class="custom-tree-node" slot-scope="{ node, data }">
          <span>{{ node.label }}</span>
          <span>
            <el-button size="mini" @click="() => append(data)">+</el-button>
            <el-button size="mini" @click="() => remove(node, data)">-</el-button>
          </span>
        </span>
      </el-tree>
    </div>
  </div>
</template>

<script>
let id = 1000;
export default {
  name: "HelloWorld",
  data() {
    const data = [
      {
        name: "Devices",
        children: [
          {
            name: "HueGW",
            children: [
              {
                name: "Lamps",
                children: [
                  {
                    name: "LivingRoomFloorLamp"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        name: "System",
        children: [
          {
            name: "Time"
          },
          {
            name: "CpuLoad"
          }
        ]
      },
      {
        name: "AriGraph",
        children: [
          {
            name: "Test"
          },
          {
            name: "Lights"
          }
        ]
      }
    ];
    return {
      msg: "EY!",
      data4: data,
      data5: data,
      defaultProps: {
        children: "children",
        label: "name"
      }
    };
  },
  methods: {
    append(data) {
      const newChild = { id: id++, name: "testtest", children: [] };
      if (!data.children) {
        this.$set(data, "children", []);
      }
      data.children.push(newChild);
    },

    remove(node, data) {
      const parent = node.parent;
      const children = parent.data.children || parent.data;
      const index = children.findIndex(d => d.id === data.id);
      children.splice(index, 1);
    }
  },
  created() {
    console.log("Getting roots!");
    let roots = this.$ari.getRoots().then(roots => {
      console.log("ROOTS:", roots);
    });
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 8px;
}
</style>
