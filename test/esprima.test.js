var esprima = require('esprima');
var fs = require('fs');
var code = `<script>
export default async function () {
	if (!Vue._opts) {
		/*枚举选项*/
		Vue._opts = {
			namespace: [
				{ label: i18n("dev"), value: "dev" },
				{ label: i18n("sit"), value: "sit" },
				{ label: i18n("uat"), value: "uat" },
				{ label: i18n("prd"), value: "prd" },
				{ label: i18n("other"), value: "other", showInput: true }
			],
			ProcessTemplate: [
				/*在entry初始化
        全应用通用*/
			],
			AllProcessTypes: [
				/*在entry初始化
        全应用通用*/
			],
			envType: [
				{ label: i18n("测试区"), value: "3" },
				{ label: i18n("办公区"), value: "2" },
				{ label: i18n("交易区"), value: "1" }
			],
			degreeOfUrgency: [
				{ label: i18n("一般"), value: "4" },
				{ label: i18n("紧急"), value: "3" },
				{ label: i18n("非常紧急"), value: "2" },
				{ label: i18n("立即解决"), value: "1" }
			],
			cloudServerType: [
				{ label: i18n("创建应用空间"), value: 1 },
				{ label: i18n("创建容器应用空间"), value: 2 },
				{ label: i18n("用户权限"), value: 3 },
				{ label: i18n("网卡申请"), value: 4 },
				{ label: i18n("ELB申请"), value: 5 },
				{ label: i18n("通用流程"), value: 6 }
			],
			resourceRegion: [{ label: i18n("深圳"), value: 8 }],
			ExaminationAndApprovalResult: [
				{ label: i18n("同意"), value: true },
				{ label: i18n("驳回"), value: false }
			],
			processStatus: [
				{ label: i18n("流程创建（新建未提交）"), value: "01" },
				{ label: i18n("流程草稿（暂存为草稿）"), value: "10" },
				{ label: i18n("流程出错"), value: "21" },
				{ label: i18n("流转中"), value: "20" },
				{ label: i18n("流程结束"), value: "30" },
				{ label: i18n("挂起状态"), value: "40" },
				{ label: i18n("废弃状态"), value: "00" }
			],
			availableArea: [],
			isBindNetwork: [
				{ label: i18n("否，默认用现有已绑定子网"), value: 0 },
				{ label: i18n("是，新增其他子网"), value: 1 }
			],
			payloadType: [
				{ label: i18n("无状态负载"), value: "Deployment" },
				{ label: i18n("有状态负载"), value: "StatefulSet" },
				{ label: i18n("守护进程集"), value: "DaemonSet" }
			],
			useOrNot: [
				{ label: "不启用", value: 0 },
				{ label: "启用", value: 1 }
			],
			seesionKeepAlive: [
				{ label: "不启用", value: "" },
				{ label: "源IP地址", value: "SOURCE_IP" }
			],
			TcpOrHttp: [
				{ label: "HTTP", value: "HTTP" },
				{ label: "TCP", value: "TCP" }
			],
			TcpOrUdp: [
				{ label: "UDP", value: "UDP" },
				{ label: "TCP", value: "TCP" }
			],
			httpOrHttps: [
				{ label: "HTTP", value: "HTTP" },
				{ label: "HTTPS", value: "HTTPS" }
			],
			elbUrlRule: [
				{ label: "前缀匹配", value: "START_WITH" },
				{ label: "精确匹配", value: "EQUAL_TO" },
				{ label: "正则匹配", value: "REGEX" }
			],
			elbProtocol: [
				{ label: "HTTP", value: "HTTP" },
				{ label: "HTTPS", value: "HTTPS" }
			]
		};
	}
	return Vue._opts;
}
</script>
`;

var ast = esprima.parseModule(code, { comment: true, jsx: true, loc: true });

fs.writeFileSync('./ast.json', JSON.stringify(ast, null, 2));