import React, { useState } from 'react';
import styled from 'styled-components';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import GoogleDriveSelector from './components/GoogleDriveSelector';
import LocalFileSelector from './components/LocalFileSelector';
import EnhancedAudioPlayer from './components/EnhancedAudioPlayer';

// Rest of your App.tsx code 

interface TrackMetadata {
  title?: string;
  artist?: string;
  album?: string;
  coverArt?: string;
}

const defaultMetadata: TrackMetadata = {
  title: 'Unknown Title',
  artist: 'Unknown Artist',
  album: 'Unknown Album',
  coverArt: undefined
}; 