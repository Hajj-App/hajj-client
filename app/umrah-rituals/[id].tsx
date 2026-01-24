/**
 * Umrah Ritual Detail Page
 * 
 * Uses the shared RitualDetailScreen component for consistency
 * and reduced code duplication.
 */

import React from "react";
import { useLocalSearchParams } from "expo-router";
import RitualDetailScreen from "@/components/shared/RitualDetailScreen";

const UmrahRitualDetail = () => {
  const { id } = useLocalSearchParams();

  return (
    <RitualDetailScreen
      ritualId={id as string}
      ritualType="umrah"
      legacyCollection="umrah_uploads"
    />
  );
};

export default UmrahRitualDetail;
