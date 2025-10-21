### gradleCompile

```shell
#!/usr/bin/env bash

Green_font_prefix="\033[32m" && Red_font_prefix="\033[31m" && Green_background_prefix="\033[42;37m" && Red_background_prefix="\033[41;37m" && Font_color_suffix="\033[0m"
info="${Green_font_prefix}[信息]${Font_color_suffix}" && error="${Red_font_prefix}[错误]${Font_color_suffix}" && tip="${Green_font_prefix}[提示]${Font_color_suffix}"

my_dir="$(dirname "$0")"

cd "$my_dir/"
sh_dir="$PWD"

cd "${my_dir}/../../"

wk_sp="${PWD}"
echo -e "$tip now in ${wk_sp}"

plug="$wk_sp/AiPluginEngine"

#bigin update model and libs
model="${sh_dir}/model"
p_lib="${sh_dir}/libs"

toModels="$plug/plugin/visionplugin/src/main/posture/cpu/assets"

echo -e "$tip to modle dir:$toModels"
toLibs="$plug/plugin/visionplugin/src/main/posture/cpu/jniLibs/arm64-v8a"



#方法
copy_model() {
if [ -d $model -a -d $toModels ];then
	if $(rm -f $toModels/*) &&  $(cp -f $model/* $toModels/); then
		echo -e "$info finish copy model"
	else
		echo -e "$error fail copy model file"
		exit
	fi
else
	echo -e "$error not found model files"
	exit
fi

if [ -d $p_lib -a -d $toLibs ];then
	if $(rm -f $toLibs/*) &&  $(cp -f $p_lib/* $toLibs/); then
		echo -e "$info finish copy so"
	else
		echo -e "$error fail copy so file"
		exit
	fi
else
	echo -e "$error not found so files"
	exit
fi

echo -e "$info finish copy model and so files"
}


read -p "is need read models(Y/N)" myn

if [ $myn = 'Y' -o $myn = 'y' ]; then
	echo -e "$info begin copy model"
	copy_model
fi

apk=$plug/plugin/
cd $apk
from=$plug/plugin/visionplugin/build/outputs/apk/postureCpuChina/release/visionplugin-posture-cpu-china-release.apk

#read -p "is old version(Y/N)" yn
if [ "$yn" = "y" -o "$yn" = "Y" ];then
	from=$plug/plugin/visionplugin/build/outputs/apk/postureCpu/release/visionplugin-posture-cpu-release.apk
fi

./gradlew visionplugin:clean; 


if [ $? -ne 0 ]; then
	echo -e "$error gradle clean err"
	exit
fi

./gradlew visionplugin:assemblePosture
if [ $? -ne 0 ]; then
	echo -e "$error gradle assemble err"
	exit
fi

echo -e "$tip now in dir:$PWD"

cd ${wk_sp}/sh_script/posture_test
echo -e "$tip now in dir:$PWD"
#from='${wk_sp}/AiPluginEngine/plugin/posture/build/outputs/apk/release/posture-release.apk'
to="./update/posture-cpu.apk"

if [ -f "$from" ]; then
	cp $from $to
	echo -e "$info finish copy posture apk"
else
	echo -e "$error posture apk not found"
	exit
fi
echo "end copy posture apk"

#bigin zip posture
push_file=$sh_dir/pushAll.bat
if [ ! -f $push_file ]; then
	touch $push_file
	echo -e "$info create bat file"
	echo -e "adb wait-for-device" > $push_file
	echo -e "adb root" >> $push_file
	echo -e "adb remount" >> $push_file
	echo -e "adb push  ./posture-cpu.apk /product_h/region_comm/china/app/AiPluginEngine/" >> $push_file
	echo -e "pause" >> $push_file
	echo -e "adb reboot" >> $push_file
	echo -e "pause" >> $push_file
fi

p_out="${sh_dir}/out"
if [ ! -d $p_out ]; then
	mkdir $p_out
	echo -e "$info mkdir $p_out"
fi

cd $p_out
echo -e "$tip now in $PWD"


to=".././update/posture-cpu.apk"
temp_name="坐姿检测插件_$(date +%Y%m%d%H%M%S)"
temp_dir="$p_out/$temp_name"
mkdir "$temp_dir"
mv $push_file $temp_dir/		
if [ -f $to ]; then
	cp $to $temp_dir/
else
	echo -e "$error not found posture apk"
	exit
fi

if [ -d $temp_dir ];then
	zip -rm ${temp_name}.zip $temp_name/
	echo -e "$info finish zip files"
fi
```

### 日志

```shell
RedPrint(){
	echo -e "\033[0;31m"
	echo -e "$1"
	echo -e "\033[0m"
}   

GreenPrint(){
	echo -e "\033[1;32m"
	echo -e "$1"
	echo -e "\033[0m"
}
OrangePrint(){
	echo -e "\033[0;33m"
	echo -e "$1"
	echo -e "\033[0m"
}

BluePrint(){
	echo -e "\033[0;34m"
	echo -e "$1"
	echo -e "\033[0m"
}

#使用
GreenPrint "message"
```

```shell
Green_font_prefix="\033[32m" && Red_font_prefix="\033[31m" && Green_background_prefix="\033[42;37m" && Red_background_prefix="\033[41;37m" && Font_color_suffix="\033[0m"
info="${Green_font_prefix}[信息]${Font_color_suffix}" && error="${Red_font_prefix}[错误]${Font_color_suffix}" && tip="${Green_font_prefix}[提示]${Font_color_suffix}"

#使用
echo -e "$info message"
```


