import {useMemo} from 'react'
import {Cloud, Database, MessageSquare, Table2, Zap} from 'lucide-react'
import {Navigate, useNavigate, useParams} from 'react-router-dom'
import {useQuery} from '@tanstack/react-query'
import {getCloudStatus, listClouds, listCloudResources, listCloudServices} from '@/api/cloudProxyClient'
import {CloudSelector} from '@/components/CloudSelector'
import type {CloudProvider} from '@/types/cloud'

const SERVICE_PLACEHOLDERS = [
    {id: 'queue', label: 'Queue', icon: MessageSquare},
    {id: 'function', label: 'Function', icon: Zap},
    {id: 'database', label: 'Database', icon: Table2},
]

export function CloudConsoleHomePage() {
    const navigate = useNavigate()
    const params = useParams()
    const routeCloud = normalizeCloud(params.cloud)
    const cloud = routeCloud ?? 'aws'

    const cloudsQuery = useQuery({
        queryKey: ['clouds'],
        queryFn: ({signal}) => listClouds(signal),
    })

    const servicesQuery = useQuery({
        queryKey: ['cloud-services', cloud],
        queryFn: ({signal}) => listCloudServices(cloud, signal),
    })

    const statusQuery = useQuery({
        queryKey: ['cloud-status', cloud],
        queryFn: ({signal}) => getCloudStatus(cloud, signal),
        refetchInterval: 10_000,
    })

    const storageResourcesQuery = useQuery({
        queryKey: ['cloud-console-resources', cloud, 'storage'],
        queryFn: ({signal}) => listCloudResources(cloud, 'storage', undefined, signal),
        enabled: servicesQuery.data?.some((service) => service.service === 'storage' && service.availability === 'available') ?? false,
    })

    const serviceCards = useMemo(() => {
        const storage = servicesQuery.data?.find((service) => service.service === 'storage')
        return [
            {
                id: 'storage',
                label: storage?.displayName ?? storageLabel(cloud),
                status: storage?.availability ?? (cloud === 'gcp' ? 'coming_soon' : 'available'),
                count: storageResourcesQuery.data?.length,
                icon: Database,
                route: `/cloud-explorer/${cloud}/storage`,
            },
            ...SERVICE_PLACEHOLDERS.map((service) => ({
                ...service,
                status: 'coming_soon' as const,
                count: undefined,
                route: undefined,
            })),
        ]
    }, [cloud, servicesQuery.data, storageResourcesQuery.data])

    if (!routeCloud) return <Navigate to="/console/aws" replace/>

    const runtimeLabel = statusQuery.data?.endpoint ?? (cloud === 'aws' ? 'http://localhost:4566' : cloud === 'azure' ? 'http://localhost:4577' : 'Future Floci-GP')
    const activeServices = serviceCards.filter((service) => service.status === 'available').length
    const resourceCount = storageResourcesQuery.data?.length ?? 0
    const runtimeState = statusQuery.isLoading
        ? 'Checking runtime'
        : statusQuery.data?.runtime === 'reachable'
            ? 'Runtime reachable'
            : statusQuery.data?.runtime === 'unavailable'
                ? 'Runtime unavailable'
                : 'Coming soon'

    return (
        <>
            <div className="page-header cloud-explorer-header">
                <div className="page-title">
                    <Cloud size={20}/>
                    <div>
                        <h2>Console Home</h2>
                        <p className="muted">Cloud-aware local runtime overview</p>
                    </div>
                </div>
                <div className="cloud-header-selectors">
                    <label>
                        <span>Cloud</span>
                        <CloudSelector
                            clouds={cloudsQuery.data ?? []}
                            selected={cloud}
                            onSelect={(nextCloud) => navigate(`/console/${nextCloud}`)}
                        />
                    </label>
                </div>
            </div>

            <div className="content cloud-console-home">
                <section className="console-summary">
                    <SummaryTile label="Cloud" value={cloud.toUpperCase()} detail={runtimeLabel}/>
                    <SummaryTile label="Runtime" value={runtimeState} detail={statusQuery.data?.error ?? (cloud === 'gcp' ? 'Adapter placeholder only' : 'Via Cloud Proxy API')}/>
                    <SummaryTile label="Active services" value={`${activeServices}`} detail="Storage only for this first multi-cloud pass"/>
                    <SummaryTile label="Resources" value={`${resourceCount}`} detail="Normalized storage resources"/>
                </section>

                <section className="console-service-grid">
                    {serviceCards.map((service) => {
                        const Icon = service.icon
                        const isAvailable = service.status === 'available'
                        const content = (
                            <>
                                <div className="service-card-header">
                                    <div className="service-icon"><Icon size={18}/></div>
                                    <div>
                                        <h3>{service.label}</h3>
                                        <span className={isAvailable ? 'status healthy' : 'status unknown'}>
                                            {isAvailable ? 'available' : 'coming soon'}
                                        </span>
                                    </div>
                                </div>
                                <div className="console-service-meta">
                                    <strong>{service.count ?? '-'}</strong>
                                    <span>{service.id === 'storage' ? 'resources' : 'not wired yet'}</span>
                                </div>
                            </>
                        )

                        return isAvailable && service.route ? (
                            <button key={service.id} className="service-card console-service-card" onClick={() => navigate(service.route)}>
                                {content}
                            </button>
                        ) : (
                            <div key={service.id} className="service-card console-service-card offline">
                                {content}
                            </div>
                        )
                    })}
                </section>
            </div>
        </>
    )
}

function SummaryTile({label, value, detail}: {label: string; value: string; detail: string}) {
    return (
        <div className="summary-tile">
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{detail}</small>
        </div>
    )
}

function storageLabel(cloud: CloudProvider): string {
    if (cloud === 'aws') return 'S3 Storage'
    if (cloud === 'azure') return 'Blob Storage'
    return 'Storage'
}

function normalizeCloud(value?: string): CloudProvider | null {
    return value === 'aws' || value === 'azure' || value === 'gcp' ? value : null
}
