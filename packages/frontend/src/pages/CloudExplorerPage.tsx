import {useMemo} from 'react'
import {Cloud, DatabaseZap, Radio, Route, ShieldCheck} from 'lucide-react'
import {Navigate, useNavigate, useParams} from 'react-router-dom'
import {useQuery} from '@tanstack/react-query'
import {listClouds, listCloudServices} from '@/api/cloudProxyClient'
import {CloudSelector} from '@/components/CloudSelector'
import {DynamicResourceView} from '@/components/DynamicResourceView'
import type {CloudProvider, CloudServiceType} from '@/types/cloud'

export function CloudExplorerPage() {
    const navigate = useNavigate()
    const params = useParams()
    const routeCloud = normalizeCloud(params.cloud)
    const routeService = normalizeService(params.service)
    const cloud = routeCloud ?? 'aws'
    const service = routeService ?? 'storage'

    const cloudsQuery = useQuery({
        queryKey: ['clouds'],
        queryFn: ({signal}) => listClouds(signal),
    })

    const servicesQuery = useQuery({
        queryKey: ['cloud-services', cloud],
        queryFn: ({signal}) => listCloudServices(cloud, signal),
    })

    const selectedService = useMemo(
        () => servicesQuery.data?.find((item) => item.service === service),
        [service, servicesQuery.data],
    )

    if (!routeCloud || !routeService) {
        return <Navigate to="/cloud-explorer/aws/storage" replace/>
    }

    return (
        <>
            <div className="page-header cloud-explorer-header">
                <div className="page-title">
                    <Cloud size={20}/>
                    <div>
                        <h2>Cloud Explorer</h2>
                        <p className="muted">Unified local runtime console</p>
                    </div>
                </div>
                <div className="cloud-header-selectors">
                    <label>
                        <span>Cloud</span>
                        <CloudSelector
                            clouds={cloudsQuery.data ?? []}
                            selected={cloud}
                            onSelect={(nextCloud) => navigate(`/cloud-explorer/${nextCloud}/storage`)}
                        />
                    </label>
                </div>
            </div>
            <div className="content cloud-explorer">
                <div className="cloud-runtime-strip">
                    <div className="runtime-card">
                        <DatabaseZap size={16}/>
                        <div>
                            <span>Proxy API</span>
                            <strong>/api/clouds/{cloud}/services/{service}</strong>
                        </div>
                    </div>
                    <div className="runtime-card">
                        <Route size={16}/>
                        <div>
                            <span>Service</span>
                            <strong>{selectedService?.displayName ?? service}</strong>
                        </div>
                    </div>
                    <div className="runtime-card">
                        <Radio size={16}/>
                        <div>
                            <span>Runtime</span>
                            <strong>{cloud === 'aws' ? 'Floci AWS Core :4566' : cloud === 'azure' ? 'Floci-AZ :4577' : 'Future Floci-GP'}</strong>
                        </div>
                    </div>
                    <div className="runtime-card">
                        <ShieldCheck size={16}/>
                        <div>
                            <span>Adapter</span>
                            <strong>{cloud === 'gcp' ? 'Coming Soon' : `${cloud.toUpperCase()} Storage Adapter`}</strong>
                        </div>
                    </div>
                    <div className={`runtime-card status ${cloud === 'gcp' ? 'pending' : 'ready'}`}>
                        <span>Service</span>
                        <strong>{cloud === 'gcp' ? 'Coming soon' : 'Adapter ready'}</strong>
                    </div>
                </div>
                <DynamicResourceView cloud={cloud} service={service}/>
            </div>
        </>
    )
}

function normalizeCloud(value?: string): CloudProvider | null {
    return value === 'aws' || value === 'azure' || value === 'gcp' ? value : null
}

function normalizeService(value?: string): CloudServiceType | null {
    return value === 'storage' ? value : null
}
