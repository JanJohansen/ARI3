<template>
	<el-container>
		<MainMenu />
		<el-container>
			<el-aside width="100px">Aside</el-aside>
			<el-container>
				<el-main style="padding: 0"> 
					<NodeTree /> 
				</el-main>
			</el-container>
		</el-container>
		<el-footer height="">Footer</el-footer>
	</el-container>
</template>

<script>
import NodeTree from "../components/NodeTree"
import MainMenu from "../components/MainMenu"
export default {
	name: "Page",
	components: {
		NodeTree,
		MainMenu
	},
	data() {
		return {
			msg: "EY!"
		}
	},
	methods: {},
	created() {
		this.$notify({
			title: "EY!",
			message: "App started!"
		})
	}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
.el-container {
	height: 100%;
}
.el-header,
.el-footer {
	background-color: #202020;
	color: rgb(255, 255, 255);
}

.el-aside { 
	background-color: #202020;
	color: white;
}

.el-main {
	background-color: #101010;
	color: white;
}
</style>
