// apps/web/src/components/ops/health-panel.tsx
import { Alert, Badge, Card, Descriptions, Space, Spin, Table, Tag, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import { useSystemHealth, useBatchStatus } from '../../api/ops.ts'
import type { OpsSystemHealth } from '../../api/ops.ts'

type BotConnectivity = OpsSystemHealth['botConnectivity'][number]

function InfrastructureHealthSection() {
  const { data, isLoading, isError } = useSystemHealth()

  const botColumns: TableColumnsType<BotConnectivity> = [
    { title: 'Mahalla', dataIndex: 'mahallaName', key: 'mahalla' },
    {
      title: 'Status', key: 'status', width: 100,
      render: (_: unknown, r: BotConnectivity) => (
        <Badge
          status={r.botStatus === 'active' ? 'success' : r.botStatus === 'removed' ? 'error' : 'warning'}
          text={r.botStatus}
        />
      ),
    },
    {
      title: 'Last seen', key: 'lastSeen', width: 170,
      render: (_: unknown, r: BotConnectivity) =>
        r.botLastSeenAt
          ? new Date(r.botLastSeenAt).toLocaleString('en-GB', { timeZone: 'UTC' })
          : '—',
    },
  ]

  return (
    <Card title="Infrastructure Health" size="small">
      {isLoading && <Spin />}
      {isError && <Alert type="error" title="Failed to load system health" />}
      {data && (
        <Space orientation="vertical" style={{ width: '100%' }}>
          <Descriptions size="small" column={2} bordered>
            <Descriptions.Item label="Database">
              <Badge
                status={data.database.status === 'ok' ? 'success' : 'error'}
                text={`${data.database.status}${data.database.latencyMs != null ? ` (${data.database.latencyMs}ms)` : ''}`}
              />
            </Descriptions.Item>
            <Descriptions.Item label="Scheduler">
              <Badge
                status={data.scheduler.status === 'running' ? 'success' : 'default'}
                text={`${data.scheduler.status} (next run: ${formatNextRun(data.scheduler.nextRunInSeconds)})`}
              />
            </Descriptions.Item>
            <Descriptions.Item label="AI API">
              <Badge
                status={data.aiApi.status === 'ok' ? 'success' : data.aiApi.status === 'error' ? 'error' : 'warning'}
                text={data.aiApi.status}
              />
            </Descriptions.Item>
            <Descriptions.Item label="Bot">
              <Badge
                status={data.bot.status === 'ok' ? 'success' : 'error'}
                text={data.bot.status}
              />
            </Descriptions.Item>
          </Descriptions>
          <Typography.Text strong style={{ fontSize: 12 }}>Bot Connectivity per Group</Typography.Text>
          <Table<BotConnectivity>
            dataSource={data.botConnectivity}
            columns={botColumns}
            rowKey="mahallaId"
            size="small"
            pagination={false}
          />
        </Space>
      )}
    </Card>
  )
}

function PipelineDiagnosticsSection() {
  const { data, isLoading, isError } = useBatchStatus()
  const result = data?.lastBatchResult

  return (
    <Card title="Pipeline Diagnostics" size="small">
      {isLoading && <Spin />}
      {isError && <Alert type="error" title="Failed to load batch status" />}
      {data && (
        <Descriptions size="small" column={2} bordered>
          <Descriptions.Item label="Filter Mode">
            <Tag color="blue">{result?.filterMode ?? 'keyword_gate'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Queue Depth">{data.queueDepth}</Descriptions.Item>
          <Descriptions.Item label="Last Batch At">
            {data.lastBatchAt
              ? new Date(data.lastBatchAt).toLocaleString('en-GB', { timeZone: 'UTC' })
              : 'Never'}
          </Descriptions.Item>
          <Descriptions.Item label="Pre-filter Discards">
            {result?.preFilterDiscards ?? '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Keyword Skipped">
            {result?.keywordSkippedCount ?? '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Signals Written">
            {result?.signalsWritten ?? '—'}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Card>
  )
}

function formatNextRun(nextRunInSeconds: number | null): string {
  if (nextRunInSeconds === null) return 'not available'
  if (nextRunInSeconds <= 0) return 'due now'
  return `${nextRunInSeconds}s`
}

export function HealthPanel() {
  return (
    <Space orientation="vertical" style={{ width: '100%' }}>
      <InfrastructureHealthSection />
      <PipelineDiagnosticsSection />
    </Space>
  )
}
