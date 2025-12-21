<template>
  <div
    class="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden rounded-md md:rounded-lg"
  >
    <!-- 桌面端表格 -->
    <div class="hidden md:block max-h-[65vh] overflow-y-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th
              v-if="isSelectionMode"
              class="px-2 py-1 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              <input
                type="checkbox"
                :checked="isAllSelected"
                @change="$emit('toggleSelectAll')"
                class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
            </th>
            <th
              class="px-2 py-1 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              @click="$emit('toggleSort', 'day')"
            >
              <div class="flex items-center gap-1">
                日期
                <div class="flex flex-col">
                  <ChevronUpIcon
                    class="h-3 w-3 -mb-0.5"
                    :class="
                      daySort === 'asc'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-400 dark:text-gray-500'
                    "
                  />
                  <ChevronDownIcon
                    class="h-3 w-3 -mt-0.5"
                    :class="
                      daySort === 'desc'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-400 dark:text-gray-500'
                    "
                  />
                </div>
              </div>
            </th>
            <th
              class="px-2 py-1 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              流水类型
            </th>
            <th
              class="px-2 py-1 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              支出/收入类型
            </th>
            <th
              class="px-2 py-1 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              支付方式
            </th>
            <th
              class="px-2 py-1 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              @click="$emit('toggleSort', 'money')"
            >
              <div class="flex items-center gap-1">
                金额
                <div class="flex flex-col">
                  <ChevronUpIcon
                    class="h-3 w-3 -mb-0.5"
                    :class="
                      moneySort === 'asc'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-400 dark:text-gray-500'
                    "
                  />
                  <ChevronDownIcon
                    class="h-3 w-3 -mt-0.5"
                    :class="
                      moneySort === 'desc'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-400 dark:text-gray-500'
                    "
                  />
                </div>
              </div>
            </th>
            <th
              class="px-2 py-1 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              名称
            </th>
            <th
              class="px-2 py-1 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              备注
            </th>
            <th
              class="px-2 py-1 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              操作
            </th>
          </tr>
        </thead>
        <tbody
          class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
        >
          <tr v-if="loading" class="hover:bg-gray-50 dark:hover:bg-gray-700">
            <td
              :colspan="isSelectionMode ? 9 : 8"
              class="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
            >
              <div class="flex items-center justify-center gap-2">
                <div
                  class="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"
                ></div>
                加载中...
              </div>
            </td>
          </tr>
          <tr
            v-else-if="flows.length === 0"
            class="hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <td
              :colspan="isSelectionMode ? 9 : 8"
              class="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
            >
              暂无数据
            </td>
          </tr>
          <template v-else>
            <template v-for="item in processedFlows" :key="item.id">
              <!-- 主记录行 -->
              <tr
                class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                :class="item.isGroupMain ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''"
              >
                <td v-if="isSelectionMode" class="px-2 py-1 whitespace-nowrap">
                  <input
                    type="checkbox"
                    :checked="selectedItems.includes(item.id)"
                    @change="$emit('toggleSelectItem', item.id)"
                    class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                </td>
                <td
                  class="px-2 py-1 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                >
                  <div class="flex items-center gap-1">
                    <button
                      v-if="item.isGroupMain && item.groupId"
                      @click="toggleGroup(item.groupId!)"
                      class="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      title="展开/折叠"
                    >
                      <CollapseIcon
                        v-if="!expandedGroups.has(item.groupId!)"
                        class="h-3 w-3 text-gray-500"
                      />
                      <ExpandIcon
                        v-else
                        class="h-3 w-3 text-gray-500"
                      />
                    </button>
                    <span>{{ item.day }}</span>
                  </div>
                </td>
                <td
                  class="px-2 py-1 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                >
                  {{ item.flowType }}
                </td>
                <td
                  class="px-2 py-1 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                >
                  {{ item.industryType }}
                </td>
                <td
                  class="px-2 py-1 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                >
                  {{ item.payType }}
                </td>
                <td class="px-2 py-1 whitespace-nowrap text-sm">
                  <span
                    :class="[
                      'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                      item.isGroupMain && item.flowType === '混合'
                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        : item.flowType === '收入'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : item.flowType === '支出'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
                    ]"
                  >
                    <span v-if="item.isGroupMain && item.groupTotalMoney !== undefined">
                      {{ Number(item.groupTotalMoney || 0).toFixed(2) }}
                    </span>
                    <span v-else>
                      {{ Number(item.money || 0).toFixed(2) }}
                    </span>
                  </span>
                </td>
                <td
                  class="px-2 py-1 text-sm text-gray-900 dark:text-gray-100 max-w-32 truncate"
                  :title="item.name"
                >
                  {{ item.name }}
                </td>
                <td
                  class="px-2 py-1 text-sm text-gray-900 dark:text-gray-100 max-w-32 truncate"
                  :title="item.description"
                >
                  {{ item.description }}
                </td>
                <td class="px-2 py-1 whitespace-nowrap text-sm font-medium">
                  <div class="flex gap-2">
                    <button
                      v-if="item.isGroupMain && item.groupId"
                      @click="$emit('unmergeGroup', item.groupId!)"
                      class="text-teal-600 hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-300 p-1 rounded hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                      title="取消合并"
                    >
                      <ArrowsPointingOutIcon class="h-4 w-4" />
                    </button>
                    <button
                      @click="$emit('editItem', item)"
                      class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      title="编辑"
                    >
                      <PencilIcon class="h-4 w-4" />
                    </button>
                    <button
                      @click="$emit('deleteItem', item)"
                      class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="删除"
                    >
                      <TrashIcon class="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
              <!-- 子记录行（展开时显示） -->
              <tr
                v-if="item.isGroupMain && item.groupId && expandedGroups.has(item.groupId) && item.groupItems"
                v-for="subItem in item.groupItems"
                :key="subItem.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-gray-50/50 dark:bg-gray-800/50"
              >
                <td v-if="isSelectionMode" class="px-2 py-1 whitespace-nowrap pl-6">
                  <input
                    type="checkbox"
                    :checked="selectedItems.includes(subItem.id)"
                    @change="$emit('toggleSelectItem', subItem.id)"
                    class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                </td>
                <td
                  v-else
                  class="px-2 py-1 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 pl-6"
                >
                  <span class="text-gray-400">└─</span> {{ subItem.day }}
                </td>
                <td
                  v-if="isSelectionMode"
                  class="px-2 py-1 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 pl-6"
                >
                  <span class="text-gray-400">└─</span> {{ subItem.day }}
                </td>
                <td
                  class="px-2 py-1 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                >
                  {{ subItem.flowType }}
                </td>
                <td
                  class="px-2 py-1 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                >
                  {{ subItem.industryType }}
                </td>
                <td
                  class="px-2 py-1 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                >
                  {{ subItem.payType }}
                </td>
                <td class="px-2 py-1 whitespace-nowrap text-sm">
                  <span
                    :class="[
                      'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                      subItem.flowType === '收入'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : subItem.flowType === '支出'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
                    ]"
                  >
                    {{ Number(subItem.money || 0).toFixed(2) }}
                  </span>
                </td>
                <td
                  class="px-2 py-1 text-sm text-gray-900 dark:text-gray-100 max-w-32 truncate"
                  :title="subItem.name"
                >
                  {{ subItem.name }}
                </td>
                <td
                  class="px-2 py-1 text-sm text-gray-900 dark:text-gray-100 max-w-32 truncate"
                  :title="subItem.description"
                >
                  {{ subItem.description }}
                </td>
                <td class="px-2 py-1 whitespace-nowrap text-sm font-medium">
                  <div class="flex gap-2">
                    <button
                      @click="$emit('editItem', subItem)"
                      class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      title="编辑"
                    >
                      <PencilIcon class="h-4 w-4" />
                    </button>
                    <button
                      @click="$emit('deleteItem', subItem)"
                      class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="删除"
                    >
                      <TrashIcon class="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </template>
          </template>
        </tbody>
      </table>
    </div>

    <!-- 移动端卡片 -->
    <div class="md:hidden">
      <div
        v-if="loading"
        class="p-8 text-center text-gray-500 dark:text-gray-400"
      >
        <div class="flex items-center justify-center gap-2">
          <div
            class="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"
          ></div>
          加载中...
        </div>
      </div>
      <div
        v-else-if="flows.length === 0"
        class="p-8 text-center text-gray-500 dark:text-gray-800"
      >
        暂无数据
      </div>
      <div class="max-h-[62vh] overflow-y-auto" v-else>
        <template v-for="item in processedFlows" :key="item.id">
          <!-- 主记录卡片 -->
          <div
            class="bg-gray-50 dark:bg-gray-800 px-2 py-2 space-y-1 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
            :class="item.isGroupMain ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''"
          >
          <!-- 顶部：复选框、日期和操作按钮 -->
          <div class="flex justify-between items-start">
            <div class="flex items-center gap-2">
              <button
                v-if="item.isGroupMain && item.groupId"
                @click="toggleGroup(item.groupId!)"
                class="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                title="展开/折叠"
              >
                <CollapseIcon
                  v-if="!expandedGroups.has(item.groupId!)"
                  class="h-3 w-3 text-gray-500"
                />
                <ExpandIcon
                  v-else
                  class="h-3 w-3 text-gray-500"
                />
              </button>
              <input
                type="checkbox"
                :checked="selectedItems.includes(item.id)"
                @change="$emit('toggleSelectItem', item.id)"
                class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <span class="text-xs text-gray-600 dark:text-gray-400">
                {{ item.day }}
                <span
                  v-if="item.isGroupMain"
                  class="text-blue-600 dark:text-blue-400 ml-1"
                >
                  ({{ item.groupCount }}条)
                </span>
              </span>
            </div>
            <div class="flex items-center gap-1">
              <button
                v-if="item.isGroupMain && item.groupId"
                @click="$emit('unmergeGroup', item.groupId!)"
                class="p-1.5 text-teal-600 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded transition-colors"
                title="取消合并"
              >
                <ArrowsPointingOutIcon class="h-3 w-3" />
              </button>
              <button
                @click="$emit('deleteItem', item)"
                class="p-1.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                title="删除"
              >
                <TrashIcon class="h-3 w-3" />
              </button>
            </div>
          </div>

          <!-- 中间内容 -->
          <div class="space-y-1">
            <div
              class="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1"
            >
              {{ item.name }}
            </div>
            <div class="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
              {{ item.description }}
            </div>


            <!-- 标签、金额和编辑按钮在同一行 -->
            <div
              class="flex flex-wrap items-center justify-between gap-1 text-xs"
            >
              <div class="flex flex-wrap gap-1">
                <span
                  class="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded"
                >
                  {{ item.flowType }}
                </span>
                <span
                  class="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 px-1.5 py-0.5 rounded"
                >
                  {{ item.industryType }}
                </span>
                <span
                  class="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 px-1.5 py-0.5 rounded"
                >
                  {{ item.payType }}
                </span>
              </div>
              <!-- 右侧：金额和编辑按钮 -->
              <div class="flex items-center gap-2">
                <span
                  :class="[
                    'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                    item.isGroupMain && item.flowType === '混合'
                      ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      : item.flowType === '收入'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : item.flowType === '支出'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
                  ]"
                >
                  <span v-if="item.isGroupMain && item.groupTotalMoney !== undefined">
                    {{ Number(item.groupTotalMoney || 0).toFixed(2) }}
                  </span>
                  <span v-else>
                    {{ Number(item.money || 0).toFixed(2) }}
                  </span>
                </span>
                <button
                  @click="$emit('editItem', item)"
                  class="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                  title="编辑"
                >
                  <PencilIcon class="h-3 w-3" />
                </button>

              </div>
            </div>
          </div>
          </div>
          <!-- 子记录卡片（展开时显示） -->
          <div
            v-if="item.isGroupMain && item.groupId && expandedGroups.has(item.groupId) && item.groupItems"
            v-for="subItem in item.groupItems"
            :key="subItem.id"
            class="bg-gray-100/50 dark:bg-gray-800/50 px-2 py-2 space-y-1 border-b border-gray-200 dark:border-gray-700 ml-4 border-l-2 border-blue-300 dark:border-blue-600 pl-2"
          >
            <!-- 顶部：复选框、日期和删除按钮 -->
            <div class="flex justify-between items-start">
              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  :checked="selectedItems.includes(subItem.id)"
                  @change="$emit('toggleSelectItem', subItem.id)"
                  class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span class="text-xs text-gray-600 dark:text-gray-400">
                  <span class="text-gray-400">└─</span> {{ subItem.day }}
                </span>
              </div>
              <div class="flex items-center">
                <button
                  @click="$emit('deleteItem', subItem)"
                  class="p-1.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  title="删除"
                >
                  <TrashIcon class="h-3 w-3" />
                </button>
              </div>
            </div>

            <!-- 中间内容 -->
            <div class="space-y-1">
              <div
                class="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1"
              >
                {{ subItem.name }}
              </div>
              <div class="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                {{ subItem.description }}
              </div>

              <!-- 标签、金额和编辑按钮在同一行 -->
              <div
                class="flex flex-wrap items-center justify-between gap-1 text-xs"
              >
                <div class="flex flex-wrap gap-1">
                  <span
                    class="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded"
                  >
                    {{ subItem.flowType }}
                  </span>
                  <span
                    class="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 px-1.5 py-0.5 rounded"
                  >
                    {{ subItem.industryType }}
                  </span>
                  <span
                    class="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 px-1.5 py-0.5 rounded"
                  >
                    {{ subItem.payType }}
                  </span>
                </div>
                <!-- 右侧：金额和编辑按钮 -->
                <div class="flex items-center gap-2">
                  <span
                    :class="[
                      'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                      subItem.flowType === '收入'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : subItem.flowType === '支出'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
                    ]"
                  >
                    {{ Number(subItem.money || 0).toFixed(2) }}
                  </span>
                  <button
                    @click="$emit('editItem', subItem)"
                    class="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    title="编辑"
                  >
                    <PencilIcon class="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 分页 -->
    <div
      v-if="!loading && flows.length && totalPages > 1"
      class="p-2 md:px-4 md:py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600"
    >
      <div class="flex items-center justify-center gap-2">
        <!-- 分页信息 -->
        <div
          class="text-sm text-gray-700 dark:text-gray-300 text-center hidden md:block"
        >
          共 {{ total }} 条记录
        </div>

        <!-- 分页控件 - 响应式布局 -->
        <div class="flex flex-row items-center justify-center gap-4">
          <!-- 每页显示数量选择 -->
          <select
            :value="pageSize"
            @change="
              $emit(
                'changePageSize',
                ($event.target as HTMLSelectElement).value
              )
            "
            class="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-green-950 dark:text-white"
          >
            <option value="20">20条/页</option>
            <option value="50">50条/页</option>
            <option value="100">100条/页</option>
          </select>

          <!-- 分页按钮 -->
          <div class="flex items-center gap-1">
            <!-- 上一页 -->
            <button
              @click="$emit('changePage', currentPage - 1)"
              :disabled="currentPage <= 1"
              class="p-1.5 sm:p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-green-950 dark:text-white transition-colors"
              title="上一页"
            >
              <ChevronLeftIcon class="h-3 w-3 sm:h-4 sm:w-4" />
            </button>

            <!-- 页码按钮 - 移动端限制显示数量 -->
            <template
              v-for="(page, index) in mobileFriendlyPageNumbers"
              :key="index"
            >
              <button
                v-if="page !== '...'"
                @click="$emit('changePage', Number(page))"
                :class="[
                  'h-7 w-7 sm:h-8 sm:w-8 text-center text-xs sm:text-sm border rounded transition-colors',
                  page === currentPage
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 bg-white dark:bg-gray-800 text-green-950 dark:text-white',
                ]"
              >
                {{ page }}
              </button>
              <span v-else class="px-1 text-gray-500 text-xs">...</span>
            </template>

            <!-- 下一页 -->
            <button
              @click="$emit('changePage', currentPage + 1)"
              :disabled="currentPage >= totalPages"
              class="p-1.5 sm:p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-green-950 dark:text-white transition-colors"
              title="下一页"
            >
              <ChevronRightIcon class="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PencilIcon,
  TrashIcon,
  ChevronDownIcon as ExpandIcon,
  ChevronRightIcon as CollapseIcon,
  ArrowsPointingOutIcon,
} from "@heroicons/vue/24/outline";
import { generateMobileFriendlyPageNumbers } from "~/utils/common";
import { doApi } from "~/utils/api";

interface FlowItem {
  id: string | number;
  day: string;
  flowType: string;
  industryType: string;
  payType: string;
  money: number;
  name: string;
  description: string;
  groupId?: string | null;
}

interface Props {
  flows: FlowItem[];
  selectedItems: (string | number)[];
  isAllSelected: boolean;
  isSelectionMode: boolean;
  currentPage: number;
  pageSize: number;
  total: number;
  totalPages: number;
  pageNumbers: (number | string)[];
  loading?: boolean;
  moneySort?: string;
  daySort?: string;
}

const props = defineProps<Props>();

// 展开/折叠状态：key 是 groupId，value 是是否展开
const expandedGroups = ref<Set<string>>(new Set());

  // 处理合并组：将 flows 组织成主记录+子记录的结构
  interface ProcessedFlowItem extends FlowItem {
    isGroupMain?: boolean; // 是否是合并组的主记录
    groupItems?: FlowItem[]; // 合并组中的其他记录
    groupTotalMoney?: number; // 合并组总金额
    groupCount?: number; // 合并组记录数
  }

  const processedFlows = computed<ProcessedFlowItem[]>(() => {
    const flows = props.flows || [];
    const result: ProcessedFlowItem[] = [];
    const processedGroupIds = new Set<string>();
    const groupMap = new Map<string, FlowItem[]>();

    // 先按 groupId 分组
    flows.forEach((flow) => {
      if (flow.groupId) {
        if (!groupMap.has(flow.groupId)) {
          groupMap.set(flow.groupId, []);
        }
        groupMap.get(flow.groupId)!.push(flow);
      }
    });

    // 处理所有记录，保持原始顺序
    flows.forEach((flow) => {
      if (flow.groupId) {
        // 如果是合并组，且还没有处理过这个组
        if (!processedGroupIds.has(flow.groupId)) {
          processedGroupIds.add(flow.groupId);
          const groupItems = groupMap.get(flow.groupId) || [];
          if (groupItems.length > 0) {
            // 找到当前记录在组中的位置（按原始顺序）
            const currentIndex = groupItems.findIndex((item) => item.id === flow.id);
            if (currentIndex === 0) {
              // 如果是第一条（按原始顺序），作为主记录
              // groupItems 包含所有记录（包括第一条），用于展开时显示
              
              // 根据收入/支出计算净额：收入为正，支出为负
              const totalMoney = groupItems.reduce((sum, item) => {
                const money = Number(item.money) || 0;
                if (item.flowType === '收入') {
                  return sum + money;
                } else if (item.flowType === '支出') {
                  return sum - money;
                } else {
                  // 不计收支，不参与计算
                  return sum;
                }
              }, 0);
              
              // 根据净额确定显示类型
              const displayFlowType = totalMoney > 0 ? '收入' : totalMoney < 0 ? '支出' : '不计收支';
              
              // 计算日期范围
              const dates = groupItems.map(item => item.day).sort();
              const dateRange = dates.length > 1 ? `${dates[0]} ~ ${dates[dates.length - 1]}` : dates[0];
              
              // 获取所有不同的类型（用于显示）
              const flowTypes = [...new Set(groupItems.map(item => item.flowType).filter(Boolean))];
              const industryTypes = [...new Set(groupItems.map(item => item.industryType).filter(Boolean))];
              const payTypes = [...new Set(groupItems.map(item => item.payType).filter(Boolean))];
              
              result.push({
                ...flow, // 保留第一条记录的基本信息作为默认值
                day: dateRange, // 日期显示为范围
                flowType: displayFlowType, // 根据净额确定显示类型
                industryType: industryTypes.length === 1 ? industryTypes[0] : '混合', // 如果类型一致则显示，否则显示"混合"
                payType: payTypes.length === 1 ? payTypes[0] : '混合', // 如果类型一致则显示，否则显示"混合"
                name: `合并记录 (${groupItems.length}条)`, // 名称显示为合并记录
                description: '', // 描述清空
                isGroupMain: true,
                groupItems: groupItems, // 包含所有记录，包括第一条
                groupTotalMoney: Math.abs(totalMoney), // 存储绝对值用于显示
                groupCount: groupItems.length,
              });
            }
            // 如果不是第一条，不在这里添加（会在主记录的子记录中显示）
          }
        }
      } else {
        // 独立记录直接添加
        result.push({ ...flow, isGroupMain: false });
      }
    });

    return result;
  });

// 切换合并组的展开/折叠
const toggleGroup = (groupId: string) => {
  if (expandedGroups.value.has(groupId)) {
    expandedGroups.value.delete(groupId);
  } else {
    expandedGroups.value.add(groupId);
  }
};

// 生成移动端友好的页码
const mobileFriendlyPageNumbers = computed(() => {
  return generateMobileFriendlyPageNumbers(
    props.currentPage,
    props.totalPages,
    3
  );
});

defineEmits<{
  toggleSelectAll: [];
  toggleSelectItem: [id: string | number];
  editItem: [item: FlowItem];
  deleteItem: [item: FlowItem];
  changePage: [page: number | string];
  changePageSize: [size: string];
  toggleSort: [field: 'money' | 'day'];
  unmergeGroup: [groupId: string];
}>();

</script>

<style scoped>
</style>
