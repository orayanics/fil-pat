"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Stack,
  Grid,
  Chip,
  Sheet,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemDecorator,
  ListItemContent,
  Avatar,
} from '@mui/joy';
import Link from 'next/link';
import {
  People,
  Assignment,
  CalendarToday,
  CheckCircle,
  Add,
  TrendingUp,
  FiberManualRecord,
  ChildCare,
  AccessTime,
} from '@mui/icons-material';
import { useSocketContext } from '@/context/SocketProvider';

interface DashboardStats {
  totalPatients: number;
  sessionsToday: number;
  activeTemplates: number;
  completedThisWeek: number;
}

interface RecentSession {
  session_id: number;
  session_uuid: string;
  status: string;
  created_at: string;
  patient: {
    patient_id: number;
    name: string;
    age?: number;
  } | null;
  template: {
    template_id: number;
    name: string;
    is_for_kids?: boolean;
  } | null;
}

interface RecentPatient {
  patient_id: number;
  name: string;
  age?: number;
  gender?: string;
  last_updated: string;
}

interface DashboardData {
  stats: DashboardStats;
  recentSessions: RecentSession[];
  recentPatients: RecentPatient[];
}

export default function ModernDashboard() {
  const { user, connectionStatus } = useSocketContext();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/clinician/dashboard/stats', {
          credentials: 'include',
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'In Progress':
        return 'primary';
      case 'Scheduled':
        return 'neutral';
      case 'Cancelled':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  if (!user) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        <Typography level="h4">Please log in to view dashboard</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Welcome Header */}
      <Box sx={{ mb: 4 }}>
        <Typography level="h2" sx={{ mb: 1 }}>
          Welcome back, {user.first_name}!
        </Typography>
        <Typography level="body-md" sx={{ color: 'text.secondary' }}>
          Here&apos;s what&apos;s happening with your practice today.
        </Typography>
      </Box>

      {/* Connection Status Banner */}
      <Sheet
        variant="soft"
        color={connectionStatus === 'connected' ? 'success' : 'neutral'}
        sx={{ p: 2, borderRadius: 'md', mb: 3 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <FiberManualRecord sx={{ fontSize: 12 }} />
          <Typography level="body-sm">
            WebSocket: {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </Typography>
        </Stack>
      </Sheet>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} sm={6} md={3}>
          <Card
            variant="outlined"
            sx={{
              p: 3,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 'lg',
              },
            }}
          >
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: 'primary.softBg', color: 'primary.solidBg' }}>
                  <People />
                </Avatar>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                  Total Patients
                </Typography>
              </Box>
              <Typography level="h2">{data?.stats.totalPatients ?? 0}</Typography>
              <Button
                component={Link}
                href="/clinician-dashboard/patients"
                size="sm"
                variant="plain"
                sx={{ alignSelf: 'flex-start' }}
              >
                View all →
              </Button>
            </Stack>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card
            variant="outlined"
            sx={{
              p: 3,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 'lg',
              },
            }}
          >
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: 'success.softBg', color: 'success.solidBg' }}>
                  <CalendarToday />
                </Avatar>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                  Sessions Today
                </Typography>
              </Box>
              <Typography level="h2">{data?.stats.sessionsToday ?? 0}</Typography>
              <Chip size="sm" variant="soft" color="success" startDecorator={<TrendingUp />}>
                Active
              </Chip>
            </Stack>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card
            variant="outlined"
            sx={{
              p: 3,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 'lg',
              },
            }}
          >
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: 'warning.softBg', color: 'warning.solidBg' }}>
                  <Assignment />
                </Avatar>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                  Templates
                </Typography>
              </Box>
              <Typography level="h2">{data?.stats.activeTemplates ?? 0}</Typography>
              <Button
                component={Link}
                href="/clinician-dashboard/templates"
                size="sm"
                variant="plain"
                sx={{ alignSelf: 'flex-start' }}
              >
                Manage →
              </Button>
            </Stack>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card
            variant="outlined"
            sx={{
              p: 3,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 'lg',
              },
            }}
          >
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: 'success.softBg', color: 'success.solidBg' }}>
                  <CheckCircle />
                </Avatar>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                  Completed This Week
                </Typography>
              </Box>
              <Typography level="h2">{data?.stats.completedThisWeek ?? 0}</Typography>
              <Chip size="sm" variant="soft" color="neutral">
                Last 7 days
              </Chip>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Typography level="title-lg" sx={{ mb: 2 }}>
          Quick Actions
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            size="lg"
            variant="solid"
            startDecorator={<Add />}
            component={Link}
            href="#new-session"
            sx={{ flex: 1 }}
          >
            Start New Session
          </Button>
          <Button
            size="lg"
            variant="outlined"
            startDecorator={<People />}
            component={Link}
            href="/clinician-dashboard/patients"
            sx={{ flex: 1 }}
          >
            Manage Patients
          </Button>
          <Button
            size="lg"
            variant="outlined"
            startDecorator={<Assignment />}
            component={Link}
            href="/clinician-dashboard/templates"
            sx={{ flex: 1 }}
          >
            Create Template
          </Button>
        </Stack>
      </Card>

      {/* Two Column Layout for Recent Activity */}
      <Grid container spacing={3}>
        {/* Recent Sessions */}
        <Grid xs={12} md={6}>
          <Card variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Typography level="title-lg" sx={{ mb: 2 }}>
              Recent Sessions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {data?.recentSessions && data.recentSessions.length > 0 ? (
              <List sx={{ '--ListItem-paddingY': '12px' }}>
                {data.recentSessions.map((session) => (
                  <ListItem key={session.session_id}>
                    <ListItemDecorator>
                      <Avatar
                        size="sm"
                        sx={{
                          bgcolor: `${getStatusColor(session.status)}.softBg`,
                          color: `${getStatusColor(session.status)}.solidBg`,
                        }}
                      >
                        <AccessTime />
                      </Avatar>
                    </ListItemDecorator>
                    <ListItemContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography level="title-sm">
                            {session.patient?.name ?? 'Anonymous Patient'}
                            {session.patient?.age && ` (${session.patient.age})`}
                          </Typography>
                          <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                            {session.template?.name ?? 'No template'}
                            {session.template?.is_for_kids && (
                              <Chip size="sm" variant="soft" color="success" sx={{ ml: 1 }}>
                                <ChildCare sx={{ fontSize: 14 }} />
                              </Chip>
                            )}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip size="sm" variant="soft" color={getStatusColor(session.status)}>
                            {session.status}
                          </Chip>
                          {session.status === 'In Progress' && (
                            <Button
                              size="sm"
                              variant="solid"
                              color="primary"
                              component={Link}
                              href={`/session/clinician/${session.session_uuid}`}
                            >
                              Continue
                            </Button>
                          )}
                        </Stack>
                      </Box>
                    </ListItemContent>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography level="body-sm" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                No recent sessions
              </Typography>
            )}
          </Card>
        </Grid>

        {/* Recent Patients */}
        <Grid xs={12} md={6}>
          <Card variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Typography level="title-lg" sx={{ mb: 2 }}>
              Recent Patients
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {data?.recentPatients && data.recentPatients.length > 0 ? (
              <List sx={{ '--ListItem-paddingY': '12px' }}>
                {data.recentPatients.map((patient) => (
                  <ListItem
                    key={patient.patient_id}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'background.level1' },
                      borderRadius: 'sm',
                    }}
                    component={Link}
                    href={`/clinician-dashboard/patients/${patient.patient_id}`}
                  >
                    <ListItemDecorator>
                      <Avatar size="sm">{patient.name.charAt(0).toUpperCase()}</Avatar>
                    </ListItemDecorator>
                    <ListItemContent>
                      <Typography level="title-sm">{patient.name}</Typography>
                      <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                        {patient.age && `${patient.age} years`}
                        {patient.age && patient.gender && ' • '}
                        {patient.gender}
                      </Typography>
                    </ListItemContent>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography level="body-sm" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                No patients yet
              </Typography>
            )}
            <Button
              component={Link}
              href="/clinician-dashboard/patients"
              size="sm"
              variant="plain"
              fullWidth
              sx={{ mt: 2 }}
            >
              View All Patients →
            </Button>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
