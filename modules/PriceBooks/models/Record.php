<?php
/*+**********************************************************************************
 * The contents of this file are subject to the vtiger CRM Public License Version 1.1
 * ("License"); You may not use this file except in compliance with the License
 * The Original Code is:  vtiger CRM Open Source
 * The Initial Developer of the Original Code is vtiger.
 * Portions created by vtiger are Copyright (C) vtiger.
 * All Rights Reserved.
 *************************************************************************************/

/**
 * PriceBooks Record Model Class
 */
class PriceBooks_Record_Model extends Vtiger_Record_Model {

	/**
	 * Function return the url to fetch List Price of the Product for the current PriceBook
	 * @return <String>
	 */
	function getProductListPriceURL() {
		$url = 'module=PriceBooks&action=ProductListPrice&record=' . $this->getId();
		$rawData = $this->getRawData();
		$src_record = $rawData['src_record'];
		if (!empty($src_record)) {
			$url .= '&itemId=' . $src_record;
		}
		return $url;
	}
	/**
	 * Function returns the List Price for PriceBook-Product/Service relation
	 * @param <Integer> $relatedRecordId - Product/Service Id
	 * @return <Integer>
	 */
	function getProductsListPrice($relatedRecordId) {
		$db = PearDatabase::getInstance();

		$result = $db->pquery('SELECT listprice FROM vtiger_pricebookproductrel WHERE pricebookid = ? AND productid = ?',
				array($this->getId(), $relatedRecordId));

		if($db->num_rows($result)) {
			 return $db->query_result($result, 0, 'listprice');
		}
		return false;
	}

	/**
	 * Function updates ListPrice for PriceBook-Product/Service relation
	 * @param <Integer> $relatedRecordId - Product/Service Id
	 * @param <Integer> $price - listprice
	 */
	function updateListPrice($relatedRecordId, $price, $priceUnit) {
		$db = PearDatabase::getInstance();

		$result = $db->pquery('SELECT * FROM vtiger_pricebookproductrel WHERE pricebookid = ? AND productid = ?',
				array($this->getId(), $relatedRecordId));
		if($db->num_rows($result)) {
			 $db->pquery('UPDATE vtiger_pricebookproductrel SET listprice = ?, listpriceunit = ? WHERE pricebookid = ? AND productid = ?',
					 array($price, $priceUnit, $this->getId(), $relatedRecordId));
		} else {
			$db->pquery('INSERT INTO vtiger_pricebookproductrel (pricebookid,productid,listprice, listpriceunit,usedcurrency) values(?,?,?,?, ?)',
					array($this->getId(), $relatedRecordId, $price, $priceUnit, $this->get('currency_id')));
		}
	}

	/**
	 * Function deletes the List Price for PriceBooks-Product/Services relationship
	 * @param <Integer> $relatedRecordId - Product/Service Id
	 */
	function deleteListPrice($relatedRecordId) {
		$db = PearDatabase::getInstance();
		$db->pquery('DELETE FROM vtiger_pricebookproductrel WHERE pricebookid = ? AND productid = ?',
					array($this->getId(), $relatedRecordId));
	}
	
	
	/**
	 * ED141005
	 * getListViewPicklistValues
	 *
	 * discounttype est défini dans Vtiger_Record_Model
	 */
	public function getPicklistValuesDetails($fieldname){
		switch($fieldname){
			case 'modeapplication':
				return array(
					'' => array( 'label' => 'Manuelle'),
					'qty' => array( 'label' => 'Par quantité' ),
					'qty,discounttype' => array( 'label' => 'Par type de remise et par quantité' ),
					//'accounttype' => array( 'label' => 'Par type de compte' ),
					'discounttype' => array( 'label' => 'Par type de remise' ),
				);
			default:
				return parent::getPicklistValuesDetails($fieldname);
		}
	}
}