'use client';

import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  List,
} from '@shared/m3';
import { Close } from '@shared/icons';
import siteLinks from '@/constants/site-links.json';
import SiteDrawerItem from './SiteDrawerItem';
import type { SiteLink } from './SiteDrawerItem';

/** Props for the SiteDrawer component. */
interface SiteDrawerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Navigation drawer showing cross-site links.
 * @param props - open state and close handler
 */
export default function SiteDrawer(
  { open, onClose }: SiteDrawerProps,
) {
  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      data-testid="site-drawer"
      aria-label="Site navigation"
    >
      <Box sx={{ width: 280, p: 2 }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Typography variant="h6">
            NextExtra
          </Typography>
          <IconButton
            onClick={onClose}
            aria-label="Close drawer"
          >
            <Close />
          </IconButton>
        </Box>
        <Divider sx={{ my: 1 }} />
        <Typography
          variant="overline"
          sx={{ px: 1, color: 'text.secondary' }}
        >
          Sites
        </Typography>
        <List dense>
          {(siteLinks as SiteLink[]).map((l) => (
            <SiteDrawerItem
              key={l.label}
              link={l}
            />
          ))}
        </List>
      </Box>
    </Drawer>
  );
}
