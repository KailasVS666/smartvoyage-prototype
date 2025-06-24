import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { List, LayoutDashboard, Map } from 'lucide-react';

interface TripViewTabsProps {
  itineraryContent: React.ReactNode;
  dashboardContent: React.ReactNode;
  mapContent: React.ReactNode;
}

const TripViewTabs: React.FC<TripViewTabsProps> = ({ itineraryContent, dashboardContent, mapContent }) => {
  return (
    <Tabs defaultValue="itinerary" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="itinerary">
          <List className="h-4 w-4 mr-2" />
          Itinerary
        </TabsTrigger>
        <TabsTrigger value="dashboard">
          <LayoutDashboard className="h-4 w-4 mr-2" />
          Dashboard
        </TabsTrigger>
        <TabsTrigger value="map">
          <Map className="h-4 w-4 mr-2" />
          Map View
        </TabsTrigger>
      </TabsList>
      <TabsContent value="itinerary">
        {itineraryContent}
      </TabsContent>
      <TabsContent value="dashboard">
        {dashboardContent}
      </TabsContent>
      <TabsContent value="map">
        {mapContent}
      </TabsContent>
    </Tabs>
  );
};

export default TripViewTabs; 