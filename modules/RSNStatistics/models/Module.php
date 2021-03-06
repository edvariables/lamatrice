<?php

class RSNStatistics_Module_Model extends Vtiger_Module_Model {
    
	/**
	 * Function to check whether the entity has an quick create menu
	 * @return <Boolean> true/false
	 * ED141024
	 */
	public function isQuickCreateMenuVisible() {
		return false ;
	}


	public function getUpdateValuesUrl($crmid, $relmodule, $statId, $begin_date = false){
		$url = "index.php?action=Update&module=".$this->getName()
			."&record=".$statId
			."&crmid=".$crmid
		;
		if($relmodule !== 'RSNStatistics' )
			$url .= "&relatedmodule=".$relmodule;
		if($begin_date )
			$url .= "&begin_date=$begin_date";
		return $url;
	}
	
	//ED devrait disparaitre au profit de Results
	//AUR_TMP check row in db !!!!!
	public function getRelatedListFields($parentModuleName) {
		$relatedListFields = array(
			'name' => 'name',
			'begin_date' => 'begin_date',
			'end_date' => 'end_date',
		);
		
		$relatedStatsFieldsCode = RSNStatistics_Utils_Helper::getModuleRelatedStatsFieldsCodes($parentModuleName);
		foreach($relatedStatsFieldsCode as $code) {
			$relatedListFields[$code] = $code;
		}
		return $relatedListFields;
	}

	public function getConfigureRelatedListFields($parentModuleName = false){
		return $this->getRelatedListFields($parentModuleName);
	}

	public function getRelationHeaders($parentModuleName, $statIds = false){
		$headerFields = array();
		$headerFields['name'] = self::getFieldModelFromName('name');
		$headerFields['begin_date'] = self::getFieldModelFromName('begin_date');
		$headerFields['end_date'] = self::getFieldModelFromName('end_date');
		if($parentModuleName == $this->getName()){
			$variableFields = $this->getRelatedStatsFieldsModels($parentModuleName, $statIds);
		}
		else {
			$variableFields = $this->getRelatedStatsFieldsModels($parentModuleName, $statIds);
		}
		$headerFields = array_merge($headerFields, $variableFields);

		return $headerFields;
	}

	public static function getFieldModel($name, $label, $typeOfData, $uiType, $statId = false) {
		$field = new Vtiger_Field_Model();
		$field->set('name', $name);
		$field->set('column', strtolower($name));
		$field->set('label', $label);
		$field->set('typeofdata', $typeOfData);
		$field->set('uitype', $uiType);
		if($statId)
			$field->set('rsnstatisticsid', $statId);

		return $field;
	}

	public static function getFieldModelFromName($name) {
		switch ($name) {
		case 'name':
			return self::getFieldModel($name, 'Nom', 'V~M', 1);
		case 'begin_date':
			return self::getFieldModel($name, 'Date debut', 'D~M', 5);
		case 'end_date':
			return self::getFieldModel($name, 'Date fin', 'D~M', 5);
		default:
			$cachedInfo = VTCacheUtils::lookupStatsFieldInfo($name);
			if ($cachedInfo === false) {
				$statField = RSNStatistics_Utils_Helper::getStatFieldFromUniquecode($name);
				if ($statField) {
					return self::getStatFieldModel($statField);
				}
			} else {
				return self::getFieldModel($name, $cachedInfo['fieldname'], $cachedInfo['typeofdata'], $cachedInfo['uitype']);
			}
		}

		return null;
	}

	public static function getStatFieldModel($statField) {
		switch ($statField['fieldtype']) { // AUR_TMP : add all needed type !!
		case 'DATE':
			$typeOfData = 'D~M';
			$uiType = 5;
			break;
		case 'CURRENCY':
			$typeOfData = 'N~M';
			$uiType = 72;
			break;
		case 'VARCHAR':
		case 'STRING':
			$typeOfData = 'V~M';
			$uiType = 1;
			break;
		default:
			$typeOfData = 'N~M';
			$uiType = 6;
		}

		VTCacheUtils::updateStatsFieldInfo($statField['uniquecode'], $statField['fieldname'], $uiType, $typeOfData);
		return self::getFieldModel($statField['uniquecode'], $statField['fieldname'], $typeOfData, $uiType, $statField['rsnstatisticsid']);
	}

	public function getRelatedStatsFieldsModels($parentModuleName, $statIds = false) {
		$fieldModels = array();
		if(!$statIds){
			$relatedStatistics = RSNStatistics_Utils_Helper::getRelatedStatistics($parentModuleName);
			$statIds = array();
			foreach ($relatedStatistics as $relatedStatistic) {
				$statIds[] = $relatedStatistic['rsnstatisticsid'];
			}
		}
		$relatedStatFields = RSNStatistics_Utils_Helper::getRelatedStatsFields($statIds);//tmp

		foreach ($relatedStatFields as $statField) {
			$fieldModels[$statField['uniquecode']] = self::getStatFieldModel($statField);
		}

		return $fieldModels;
	}
}
?>